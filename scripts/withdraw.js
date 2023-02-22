const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("withdrawing Contract ..... ")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    const y = await fundMe.provider.getBalance(fundMe.address)
    console.log(y.toString())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
