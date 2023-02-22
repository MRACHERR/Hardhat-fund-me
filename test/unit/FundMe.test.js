const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const {
    isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
describe("FundMe", async () => {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendvalue = ethers.utils.parseEther("1")

    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", async function () {
        it("sets the aggregator addresss correctly", async function () {
            const response = await fundMe.getPriceFeed()
            assert.equal(mockV3Aggregator.address, response)
        })
    })
    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "Didn't send enought!"
            )
        })
        it("updated the amount funded data structure", async () => {
            await fundMe.fund({ value: sendvalue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendvalue.toString())
        })
        it("adds funder to array getFunsders() ", async () => {
            await fundMe.fund({ value: sendvalue })
            const funder = await fundMe.getFunsders(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendvalue })
        })
        it("withdraw ETH form a single founder", async function () {
            //arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //asset
            assert.equal(endingFundMeBalance.toString(), 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })
        it("allow withdraw with multiple getFunsders", async function () {
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectContract = await fundMe.connect(accounts[i])
                await fundMeConnectContract.fund({ value: sendvalue })
            }
            //arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //asset
            await expect(fundMe.getFunsders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
        it("Only allow the Owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const fundMeconnectedContract = await fundMe.connect(accounts[1])
            await expect(fundMeconnectedContract.withdraw()).to.be.reverted
        })
        it("cheaper withdraw testing  .....", async function () {
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectContract = await fundMe.connect(accounts[i])
                await fundMeConnectContract.fund({ value: sendvalue })
            }
            //arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //asset
            await expect(fundMe.getFunsders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
    })
})
