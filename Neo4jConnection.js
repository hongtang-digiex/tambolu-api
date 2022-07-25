const neo4j = require('neo4j-driver')
const config = require('./config.json')

// console.log(session);
const PATH = config.NEO4J_DB_CONFIG.PATH;
const USERNAME = config.NEO4J_DB_CONFIG.USERNAME;
const PASSWORD = config.NEO4J_DB_CONFIG.PASSWORD;

async function createCategory(product) {
  const driver = neo4j.driver(PATH, neo4j.auth.basic(USERNAME, PASSWORD))
  const session = driver.session()

  try {
    let category = await session.run(
      `MATCH (n:Category) return n`
    )

    if (category.records.length < 10) {
      for (let record of product) {
        await session.run(
          `CREATE (n:Category {name: $name}) return n`,
          {
            name: record.name
          }
        )

      }
      console.log("create successfully");
    } else
      console.log("cannot import to database because enough");
  }
  catch (err) {
    await console.error(err);
  }
  finally {
    await session.close()
  }
}

async function writeData(product) {

  const driver = neo4j.driver(PATH, neo4j.auth.basic(USERNAME, PASSWORD))
  const session = driver.session()

  let d = []
  try {
    readData().then(async (res) => {
      await d.push(...res)
    })
    for (var i = 0; i < product.length; i++) {
      if (product[i].imgsrc != "" && !d.some(a => a.link == product[i].link)) {
        await session.run(
          'CREATE (a:Product {id: $id, link: $link, imgSrc: $imgSrc, title: $title, price: $price, refund: $refund})',
          {
            id: (i).toString(16),
            link: product[i].link,
            imgSrc: product[i].imgsrc,
            title: product[i].title,
            price: product[i].price,
            refund: product[i].refund
          }

        )

        await session.run(
          `MATCH (a:Product {id: $id, link: $link, imgSrc: $imgSrc, title: $title, price: $price, refund: $refund}), (b:Category {name: $category})
          CREATE (a) -[r:PRODUCT_OF]-> (b)`,
          {
            id: (i).toString(16),
            link: product[i].link,
            imgSrc: product[i].imgsrc,
            title: product[i].title,
            price: product[i].price,
            refund: product[i].refund,
            category: product[i].category
          }

        )
      }
      // await console.log(product[i]);
    }




    await console.log("writing done");
  }
  catch (err) {
    await console.error(err);
  }
  finally {
    await session.close()
  }

  // on application exit:
  await driver.close()
}
async function readData() {
  let data = [];
  const driver = await neo4j.driver(PATH, neo4j.auth.basic(USERNAME, PASSWORD))
  const session = await driver.session()


  try {
    const result = await session.run(
      'MATCH (a:Product) return a'
    )
    const records = result.records
    records.forEach(async (rec) => {
      await data.push(rec.get(0).properties)
    })

    // await console.log(data);
  }
  catch (err) {
    await console.error(err);
  }
  finally {
    await session.close()

  }

  // on application exit:
  await driver.close()
  return data;
}

module.exports = {
  create_categories: createCategory,
  write: writeData,
  read: readData
}