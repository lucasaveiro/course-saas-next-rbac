import { prisma } from '../lib/prisma'

async function main() {
  // Buscar a organização Aveiro Blocos
  const organization = await prisma.organization.findFirst({
    where: {
      name: 'Aveiro Blocos'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true
    }
  })

  if (!organization) {
    console.log('Organização "Aveiro Blocos" não encontrada')
    return
  }

  console.log('Organização encontrada:', organization)

  // Buscar lojas associadas a esta organização
  const stores = await prisma.store.findMany({
    where: {
      organizationId: organization.id
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      ownerId: true,
      avatarUrl: true,
      organizationId: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      }
    }
  })

  console.log(`Número de lojas encontradas: ${stores.length}`)
  console.log('Lojas:', JSON.stringify(stores, null, 2))

  // Verificar se há algum problema com a estrutura das lojas
  if (stores.length > 0) {
    for (const store of stores) {
      console.log(`\nVerificando loja: ${store.name} (${store.id})`)
      
      // Verificar se o owner existe
      if (!store.owner) {
        console.log(`ERRO: Owner não encontrado para a loja ${store.name}`)
      }
      
      // Verificar se há domínios associados à loja
      const storeDomains = await prisma.storeDomain.findMany({
        where: {
          storeId: store.id
        }
      })
      
      console.log(`Domínios da loja: ${storeDomains.length}`)
      console.log('Domínios:', JSON.stringify(storeDomains, null, 2))
    }
  }
}

main()
  .then(() => {
    console.log('Verificação concluída')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erro durante a verificação:', error)
    process.exit(1)
  })