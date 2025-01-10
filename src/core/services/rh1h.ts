import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔐 Setting up authentication...")

  try {
    // Create admin user if it doesn't exist
    const admin = await prisma.user.upsert({
      where: { email: "admin@ai-lms.com" },
      update: {},
      create: {
        email: "admin@ai-lms.com",
        name: "Admin User",
        role: "ADMIN",
      },
    })

    console.log("✅ Admin user created:", admin.email)

    // Create instructor user if it doesn't exist
    const instructor = await prisma.user.upsert({
      where: { email: "instructor@ai-lms.com" },
      update: {},
      create: {
        email: "instructor@ai-lms.com",
        name: "Instructor User",
        role: "INSTRUCTOR",
      },
    })

    console.log("✅ Instructor user created:", instructor.email)

    console.log("✨ Auth setup completed successfully!")
  } catch (error) {
    console.error("❌ Error during auth setup:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 