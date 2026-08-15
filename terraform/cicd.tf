# --- CI/CD: let GitHub Actions deploy via AWS Systems Manager ---
#
# OIDC (federated role assumption, no static keys) was tried first but this AWS
# account hits AWS's new-account fraud restrictions on sts:AssumeRoleWithWebIdentity
# from GitHub's OIDC provider — AssumeRoleWithWebIdentity is denied even with a
# correct trust policy (same issue hit on the Memories project). Falling back to a
# narrowly-scoped IAM user + access key instead: it can only send SSM commands to
# this one instance, nothing else.

# Let the SSM Agent (already running on Amazon Linux 2023) register the instance
# with Systems Manager so it can receive Run Command deployments.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_user" "github_actions_deploy" {
  name = "${var.project_name}-deploy"
}

resource "aws_iam_access_key" "github_actions_deploy" {
  user = aws_iam_user.github_actions_deploy.name
}

resource "aws_iam_user_policy" "github_actions_deploy" {
  name = "${var.project_name}-gha-deploy"
  user = aws_iam_user.github_actions_deploy.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ssm:SendCommand"
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/${aws_instance.app.id}",
          "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
        Resource = "*"
      },
    ]
  })
}

# Written to a gitignored local file, same pattern as the SSH private key in
# main.tf — never printed to a terminal/log, only read to populate GitHub secrets.
resource "local_sensitive_file" "deploy_access_key" {
  content = jsonencode({
    access_key_id     = aws_iam_access_key.github_actions_deploy.id
    secret_access_key = aws_iam_access_key.github_actions_deploy.secret
  })
  filename        = "${path.module}/deploy-access-key.json"
  file_permission = "0600"
}

output "instance_id" {
  value = aws_instance.app.id
}
