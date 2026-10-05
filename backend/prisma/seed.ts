
import {
  PrismaClient,
  Role,
  IncidentSeverity,
  IncidentStatus,
  IncidentEventType,
  NotificationType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...");

  // ---------------------------------------------------------
  // 1. PASSWORD
  // ---------------------------------------------------------

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // ---------------------------------------------------------
  // 2. USERS
  // ---------------------------------------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@incidentapp.com",
    },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@incidentapp.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const alice = await prisma.user.upsert({
    where: {
      email: "alice@incidentapp.com",
    },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@incidentapp.com",
      passwordHash,
      role: Role.RESPONDER,
    },
  });

  const bob = await prisma.user.upsert({
    where: {
      email: "bob@incidentapp.com",
    },
    update: {},
    create: {
      name: "Bob Williams",
      email: "bob@incidentapp.com",
      passwordHash,
      role: Role.RESPONDER,
    },
  });

  const charlie = await prisma.user.upsert({
    where: {
      email: "charlie@incidentapp.com",
    },
    update: {},
    create: {
      name: "Charlie Brown",
      email: "charlie@incidentapp.com",
      passwordHash,
      role: Role.RESPONDER,
    },
  });

  const david = await prisma.user.upsert({
    where: {
      email: "david@incidentapp.com",
    },
    update: {},
    create: {
      name: "David Miller",
      email: "david@incidentapp.com",
      passwordHash,
      role: Role.VIEWER,
    },
  });

  console.log("✅ Users created");

  // ---------------------------------------------------------
  // 3. INCIDENTS
  // ---------------------------------------------------------

  const incident1 = await prisma.incident.create({
    data: {
      title: "Production API returning 500 errors",
      description:
        "The production API is returning intermittent 500 responses for authenticated users.",
      severity: IncidentSeverity.SEV1,
      status: IncidentStatus.RESOLVED,
      createdById: admin.id,
      assignedToId: alice.id,
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
  });

  const incident2 = await prisma.incident.create({
    data: {
      title: "Payment processing delays",
      description:
        "Customers are experiencing delays while completing payment transactions.",
      severity: IncidentSeverity.SEV2,
      status: IncidentStatus.RESOLVING,
      createdById: alice.id,
      assignedToId: bob.id,
    },
  });

  const incident3 = await prisma.incident.create({
    data: {
      title: "Database connection pool exhausted",
      description:
        "Database connection usage has reached the configured pool limit.",
      severity: IncidentSeverity.SEV1,
      status: IncidentStatus.MITIGATING,
      createdById: admin.id,
      assignedToId: charlie.id,
    },
  });

  const incident4 = await prisma.incident.create({
    data: {
      title: "User login failures",
      description:
        "A subset of users are unable to log in using their existing credentials.",
      severity: IncidentSeverity.SEV2,
      status: IncidentStatus.INVESTIGATING,
      createdById: bob.id,
      assignedToId: alice.id,
    },
  });

  const incident5 = await prisma.incident.create({
    data: {
      title: "Notification delivery delayed",
      description:
        "Incident notifications are being delivered several minutes after the triggering event.",
      severity: IncidentSeverity.SEV3,
      status: IncidentStatus.OPEN,
      createdById: charlie.id,
      assignedToId: bob.id,
    },
  });

  const incident6 = await prisma.incident.create({
    data: {
      title: "Frontend dashboard loading slowly",
      description:
        "The incident dashboard takes longer than expected to load for some users.",
      severity: IncidentSeverity.SEV3,
      status: IncidentStatus.OPEN,
      createdById: alice.id,
    },
  });

  const incident7 = await prisma.incident.create({
    data: {
      title: "Incorrect incident status displayed",
      description:
        "The incident detail page occasionally displays an outdated status.",
      severity: IncidentSeverity.SEV4,
      status: IncidentStatus.INVESTIGATING,
      createdById: bob.id,
      assignedToId: charlie.id,
    },
  });

  const incident8 = await prisma.incident.create({
    data: {
      title: "Search results missing recent incidents",
      description:
        "Incident search occasionally fails to return newly created incidents.",
      severity: IncidentSeverity.SEV3,
      status: IncidentStatus.RESOLVED,
      createdById: admin.id,
      assignedToId: bob.id,
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    },
  });

  const incident9 = await prisma.incident.create({
    data: {
      title: "High CPU usage on application server",
      description:
        "Application server CPU usage has remained above the configured threshold.",
      severity: IncidentSeverity.SEV2,
      status: IncidentStatus.MITIGATING,
      createdById: charlie.id,
      assignedToId: alice.id,
    },
  });

  const incident10 = await prisma.incident.create({
    data: {
      title: "Email notification failures",
      description:
        "Some system-generated email notifications are failing to send.",
      severity: IncidentSeverity.SEV3,
      status: IncidentStatus.RESOLVED,
      createdById: bob.id,
      assignedToId: charlie.id,
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  });

  const incident11 = await prisma.incident.create({
    data: {
      title: "API response latency increased",
      description:
        "Average API response latency has increased significantly during peak traffic.",
      severity: IncidentSeverity.SEV2,
      status: IncidentStatus.RESOLVING,
      createdById: alice.id,
      assignedToId: bob.id,
    },
  });

  const incident12 = await prisma.incident.create({
    data: {
      title: "Incident list pagination issue",
      description:
        "Some incident records are not displayed when navigating between pagination pages.",
      severity: IncidentSeverity.SEV4,
      status: IncidentStatus.OPEN,
      createdById: admin.id,
    },
  });

  console.log("✅ Incidents created");

  // ---------------------------------------------------------
  // 4. COMMENTS
  // ---------------------------------------------------------

  await prisma.incidentComment.createMany({
    data: [
      {
        incidentId: incident1.id,
        userId: alice.id,
        content:
          "Identified the failing API endpoint. Working on the underlying database query.",
      },
      {
        incidentId: incident1.id,
        userId: admin.id,
        content:
          "Please keep the incident updated with the mitigation progress.",
      },
      {
        incidentId: incident2.id,
        userId: bob.id,
        content:
          "Payment provider latency appears to be the primary contributor.",
      },
      {
        incidentId: incident3.id,
        userId: charlie.id,
        content:
          "Reduced connection usage and monitoring the pool utilization.",
      },
      {
        incidentId: incident4.id,
        userId: alice.id,
        content:
          "Investigating authentication logs for the affected users.",
      },
      {
        incidentId: incident5.id,
        userId: bob.id,
        content:
          "Notification queue is currently processing normally. Monitoring delivery times.",
      },
      {
        incidentId: incident6.id,
        userId: alice.id,
        content:
          "Initial investigation suggests the incident list query is taking longer than expected.",
      },
      {
        incidentId: incident7.id,
        userId: charlie.id,
        content:
          "Checking the frontend cache and query invalidation behavior.",
      },
      {
        incidentId: incident8.id,
        userId: bob.id,
        content:
          "Search indexing/query parameters were corrected and results are now appearing.",
      },
      {
        incidentId: incident9.id,
        userId: alice.id,
        content:
          "CPU usage dropped after reducing the expensive background workload.",
      },
      {
        incidentId: incident10.id,
        userId: charlie.id,
        content:
          "Email provider logs show successful delivery after the retry process.",
      },
      {
        incidentId: incident11.id,
        userId: bob.id,
        content:
          "Latency is improving after optimizing the slowest API query.",
      },
    ],
  });

  console.log("✅ Comments created");

  // ---------------------------------------------------------
  // 5. INCIDENT EVENTS / TIMELINE
  // ---------------------------------------------------------

  await prisma.incidentEvent.createMany({
    data: [
      // Incident 1
      {
        incidentId: incident1.id,
        userId: admin.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident1.id,
        userId: alice.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Alice Johnson",
      },
      {
        incidentId: incident1.id,
        userId: alice.id,
        type: IncidentEventType.STATUS_CHANGED,
        message: "Incident status changed",
      },
      {
        incidentId: incident1.id,
        userId: admin.id,
        type: IncidentEventType.COMMENT_ADDED,
        message: "Comment added to incident",
      },
      {
        incidentId: incident1.id,
        userId: alice.id,
        type: IncidentEventType.RESOLVED,
        message: "Incident resolved",
      },

      // Incident 2
      {
        incidentId: incident2.id,
        userId: alice.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident2.id,
        userId: bob.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Bob Williams",
      },
      {
        incidentId: incident2.id,
        userId: bob.id,
        type: IncidentEventType.STATUS_CHANGED,
        message: "Incident status changed",
      },
      {
        incidentId: incident2.id,
        userId: bob.id,
        type: IncidentEventType.COMMENT_ADDED,
        message: "Comment added to incident",
      },

      // Incident 3
      {
        incidentId: incident3.id,
        userId: admin.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident3.id,
        userId: charlie.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Charlie Brown",
      },
      {
        incidentId: incident3.id,
        userId: charlie.id,
        type: IncidentEventType.STATUS_CHANGED,
        message: "Incident status changed",
      },

      // Incident 4
      {
        incidentId: incident4.id,
        userId: bob.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident4.id,
        userId: alice.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Alice Johnson",
      },
      {
        incidentId: incident4.id,
        userId: alice.id,
        type: IncidentEventType.STATUS_CHANGED,
        message: "Incident status changed",
      },

      // Incident 5
      {
        incidentId: incident5.id,
        userId: charlie.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident5.id,
        userId: bob.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Bob Williams",
      },
      {
        incidentId: incident5.id,
        userId: bob.id,
        type: IncidentEventType.COMMENT_ADDED,
        message: "Comment added to incident",
      },

      // Incident 6
      {
        incidentId: incident6.id,
        userId: alice.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },

      // Incident 7
      {
        incidentId: incident7.id,
        userId: bob.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident7.id,
        userId: charlie.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Charlie Brown",
      },
      {
        incidentId: incident7.id,
        userId: charlie.id,
        type: IncidentEventType.STATUS_CHANGED,
        message: "Incident status changed",
      },

      // Incident 8
      {
        incidentId: incident8.id,
        userId: admin.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident8.id,
        userId: bob.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Bob Williams",
      },
      {
        incidentId: incident8.id,
        userId: bob.id,
        type: IncidentEventType.RESOLVED,
        message: "Incident resolved",
      },

      // Incident 9
      {
        incidentId: incident9.id,
        userId: charlie.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident9.id,
        userId: alice.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Alice Johnson",
      },
      {
        incidentId: incident9.id,
        userId: alice.id,
        type: IncidentEventType.STATUS_CHANGED,
        message: "Incident status changed",
      },

      // Incident 10
      {
        incidentId: incident10.id,
        userId: bob.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident10.id,
        userId: charlie.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Charlie Brown",
      },
      {
        incidentId: incident10.id,
        userId: charlie.id,
        type: IncidentEventType.RESOLVED,
        message: "Incident resolved",
      },

      // Incident 11
      {
        incidentId: incident11.id,
        userId: alice.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
      {
        incidentId: incident11.id,
        userId: bob.id,
        type: IncidentEventType.ASSIGNED,
        message: "Incident assigned to Bob Williams",
      },
      {
        incidentId: incident11.id,
        userId: bob.id,
        type: IncidentEventType.STATUS_CHANGED,
        message: "Incident status changed",
      },

      // Incident 12
      {
        incidentId: incident12.id,
        userId: admin.id,
        type: IncidentEventType.CREATED,
        message: "Incident created",
      },
    ],
  });

  console.log("✅ Incident events created");

  // ---------------------------------------------------------
  // 6. NOTIFICATIONS
  // ---------------------------------------------------------

  await prisma.notification.createMany({
    data: [
      {
        type: NotificationType.INCIDENT_ASSIGNED,
        message:
          "You have been assigned to incident: Production API returning 500 errors",
        userId: alice.id,
        incidentId: incident1.id,
      },
      {
        type: NotificationType.INCIDENT_STATUS_CHANGED,
        message:
          "Incident status changed: Production API returning 500 errors",
        userId: admin.id,
        incidentId: incident1.id,
      },
      {
        type: NotificationType.INCIDENT_COMMENT_ADDED,
        message:
          "A new comment was added to: Payment processing delays",
        userId: alice.id,
        incidentId: incident2.id,
      },
      {
        type: NotificationType.INCIDENT_ASSIGNED,
        message:
          "You have been assigned to incident: Database connection pool exhausted",
        userId: charlie.id,
        incidentId: incident3.id,
      },
      {
        type: NotificationType.INCIDENT_STATUS_CHANGED,
        message:
          "Incident status changed: Database connection pool exhausted",
        userId: admin.id,
        incidentId: incident3.id,
      },
      {
        type: NotificationType.INCIDENT_COMMENT_ADDED,
        message:
          "A new comment was added to: User login failures",
        userId: bob.id,
        incidentId: incident4.id,
      },
      {
        type: NotificationType.INCIDENT_ASSIGNED,
        message:
          "You have been assigned to incident: Notification delivery delayed",
        userId: bob.id,
        incidentId: incident5.id,
      },
      {
        type: NotificationType.INCIDENT_UPDATED,
        message:
          "Incident updated: Frontend dashboard loading slowly",
        userId: alice.id,
        incidentId: incident6.id,
      },
      {
        type: NotificationType.INCIDENT_STATUS_CHANGED,
        message:
          "Incident status changed: Incorrect incident status displayed",
        userId: bob.id,
        incidentId: incident7.id,
      },
      {
        type: NotificationType.INCIDENT_STATUS_CHANGED,
        message:
          "Incident resolved: Search results missing recent incidents",
        userId: admin.id,
        incidentId: incident8.id,
        isRead: true,
      },
      {
        type: NotificationType.INCIDENT_ASSIGNED,
        message:
          "You have been assigned to incident: High CPU usage on application server",
        userId: alice.id,
        incidentId: incident9.id,
      },
      {
        type: NotificationType.INCIDENT_STATUS_CHANGED,
        message:
          "Incident resolved: Email notification failures",
        userId: bob.id,
        incidentId: incident10.id,
        isRead: true,
      },
      {
        type: NotificationType.INCIDENT_COMMENT_ADDED,
        message:
          "A new comment was added to: API response latency increased",
        userId: alice.id,
        incidentId: incident11.id,
      },
      {
        type: NotificationType.INCIDENT_UPDATED,
        message:
          "Incident updated: Incident list pagination issue",
        userId: admin.id,
        incidentId: incident12.id,
      },
    ],
  });

  console.log("✅ Notifications created");

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------

  console.log("");
  console.log("🎉 Seed completed successfully!");
  console.log("");
  console.log("Test accounts:");
  console.log("-------------------------------");
  console.log("ADMIN");
  console.log("  admin@incidentapp.com");
  console.log("  Password123!");
  console.log("");
  console.log("RESPONDER");
  console.log("  alice@incidentapp.com");
  console.log("  Password123!");
  console.log("");
  console.log("RESPONDER");
  console.log("  bob@incidentapp.com");
  console.log("  Password123!");
  console.log("");
  console.log("RESPONDER");
  console.log("  charlie@incidentapp.com");
  console.log("  Password123!");
  console.log("");
  console.log("VIEWER");
  console.log("  david@incidentapp.com");
  console.log("  Password123!");
  console.log("-------------------------------");
  console.log("");
  console.log("Seed data:");
  console.log("  Users: 5");
  console.log("  Incidents: 12");
  console.log("  Comments: 12");
  console.log("  Timeline events: multiple");
  console.log("  Notifications: 14");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

