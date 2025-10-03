import { prisma } from '../src/lib/prisma'

async function main() {
  try {
    // Query for organization with name 'Aveiro Blocos'
    const organization = await prisma.organization.findFirst({
      where: {
        name: 'Aveiro Blocos'
      },
      include: {
        members: true,
        invites: true,
        owner: true
      }
    })

    if (organization) {
      console.log('Organization found:')
      console.log(JSON.stringify(organization, null, 2))
    } else {
      console.log('No organization found with name "Aveiro Blocos"')
      
      // List all organizations
      console.log('\nListing all organizations:')
      const allOrgs = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true
        }
      })
      
      console.log(JSON.stringify(allOrgs, null, 2))
    }
  } catch (error) {
    console.error('Error querying database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()