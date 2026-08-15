# --- CI/CD: let GitHub Actions deploy via AWS Systems Manager, no SSH/static keys ---

variable "github_repo" {
  description = "GitHub \"owner/repo\" allowed to assume the deploy role via OIDC"
  type        = string
  default     = "Moshik23/domaine-seetloo-booking"
}

# Let the SSM Agent (already running on Amazon Linux 2023) register the instance
# with Systems Manager so it can receive Run Command deployments.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Reuses the GitHub OIDC provider already registered in this AWS account
# (one provider per URL per account; other projects share it).
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "github_actions_deploy" {
  name = "${var.project_name}-gha-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          # Only the master branch of this exact repo can assume the role —
          # not PRs, not forks, not other repos sharing the account's OIDC provider.
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/master"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "${var.project_name}-gha-deploy"
  role = aws_iam_role.github_actions_deploy.id

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

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_deploy.arn
}

output "instance_id" {
  value = aws_instance.app.id
}
