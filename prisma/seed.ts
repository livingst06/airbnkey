async function main() {
  console.log("Seed skip: no default apartments are inserted.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
