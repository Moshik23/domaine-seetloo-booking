import { BUSINESS_NAME } from "@/lib/constants";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-2 text-sm font-semibold text-rose-800 dark:text-rose-300">{title}</h2>
      <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">{children}</div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Help</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          A quick guide to using the {BUSINESS_NAME} booking portal.
        </p>
      </div>

      <Section title="Checking if a date is free">
        <p>
          The <strong>calendar on the Dashboard</strong> is the fastest way to answer &ldquo;is that date
          free?&rdquo; while a customer is on the phone.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>A blue bar under a date means the <strong>Hall</strong> is booked that day.</li>
          <li>A green bar means the <strong>Chalet</strong> is booked that day.</li>
          <li>No bar of a colour means that venue is free that day.</li>
          <li>Click any date to see exactly who booked it and which event (e.g. Haldi, Reception).</li>
          <li>Use the <strong>Jump to date</strong> box or the arrows to move between months quickly.</li>
          <li>An amber dot marks a <strong>Mauritius public holiday</strong> — always shown.</li>
          <li>
            Tick <strong>Hindu wedding calendar</strong> to also show a violet dot on dates that fall within a
            period traditionally considered inauspicious for Hindu weddings (Kharmas, Chaturmas, Pitru Paksha,
            etc.) — off by default so it doesn&rsquo;t clutter the calendar.
          </li>
        </ul>
      </Section>

      <Section title="Public holiday &amp; Hindu calendar dates — how they&rsquo;re kept up to date">
        <p>
          Both overlays are a fixed list built into the app, not something it looks up automatically — there
          is no reliable, official feed the site can poll, so nothing checks or refreshes these on its own.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Public holidays</strong> are only official once Mauritius publishes the Government Gazette
            notice for that year (usually late the year before) — several (Maha Shivaratree, Eid, Divali, etc.)
            follow the lunar/religious calendar and shift every year.
          </li>
          <li>
            <strong>Hindu calendar periods</strong> shift every year too, and by more — Kharmas moves by about a
            day, but Chaturmas, Holashtak, and Pitru Paksha can shift by weeks, and Adhik Maas (an inserted
            extra month) only happens roughly once every 32–33 months.
          </li>
          <li>
            Currently the list only covers <strong>2026</strong> (into mid-January 2027 for the Hindu calendar).
            Once dates run past that, the amber/violet markers simply stop appearing — nothing breaks, they
            just go quiet. Whoever maintains the site needs to add the next year&rsquo;s dates by hand once
            they&rsquo;re published (Gazette notice for holidays; any Hindu Panchang or vivah-muhurat calendar
            for the wedding dates), the same way this year&rsquo;s were entered.
          </li>
        </ul>
      </Section>

      <Section title="Creating a new booking">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Click <strong>+ New Booking</strong> (top right of the Dashboard, or in the menu).</li>
          <li>Fill in the customer&rsquo;s details (surname, other names, phone, address).</li>
          <li>
            Add each event under <strong>Events</strong> — e.g. Geet Gawai, Haldi, Reception — with its own
            date, time, and whether it&rsquo;s in the Hall, Chalet, or both. Click{" "}
            <strong>+ Add Event</strong> for each one.
          </li>
          <li>
            Set <strong>Date In</strong> / <strong>Date Out</strong> (the overall stay), then click{" "}
            <strong>Set from events</strong> to fill in Occupancy automatically.
          </li>
          <li>Enter the Agreed Price, Deposit, and who&rsquo;s booking it in.</li>
          <li>Click <strong>Create Booking</strong>.</li>
        </ol>
      </Section>

      <Section title="If you see a red “Clashes with” message">
        <p>
          This means the dates/venue you entered are already booked by someone else — the portal
          will not let you save it. Check the name and date shown, adjust the venue or dates, or
          confirm with the existing customer before changing anything.
        </p>
      </Section>

      <Section title="If you see a yellow/amber information message">
        <p>
          This appears while filling in a booking when one of the dates falls on a public holiday, or
          within a period traditionally considered inauspicious for Hindu weddings. It&rsquo;s just a
          heads-up so you can mention it to the client — it does <strong>not</strong> block the
          booking, unlike the red clash message above.
        </p>
      </Section>

      <Section title="Viewing, editing, or cancelling a booking">
        <p>
          Click a customer&rsquo;s name anywhere (Dashboard list, calendar, or search) to open their
          booking. From there:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Edit</strong> — change any detail and save. It will warn you if the change now clashes with another booking.</li>
          <li><strong>Cancel Booking</strong> — marks it as cancelled and frees up those dates for someone else. It is not deleted, just kept as a record.</li>
          <li><strong>Print</strong> — opens a printable confirmation form to hand to the customer.</li>
        </ul>
      </Section>

      <Section title="Recording payments">
        <p>
          Open the booking, scroll to <strong>Payments</strong>, and use the form there to add each
          amount as the customer pays it. The <strong>Outstanding</strong> amount at the top updates
          automatically (Agreed Price minus Deposit minus everything logged).
        </p>
      </Section>

      <Section title="Finding a booking">
        <p>
          On the Dashboard, use <strong>Surname / Name</strong>, <strong>Venue</strong>, or a date
          range to filter the list. Tick <strong>Include cancelled</strong> to also see cancelled
          bookings.
        </p>
      </Section>

      <Section title="Getting logged out automatically">
        <p>
          If the portal sits open without any clicks or page changes for <strong>30 minutes</strong>,
          it logs out on its own and sends you back to the password screen. This is a security measure
          now that the portal is reachable over the open internet, not just from this computer. Any
          activity — clicking around, saving a booking — resets the 30 minutes, so it only logs out
          during genuine idle time.
        </p>
      </Section>
    </div>
  );
}
