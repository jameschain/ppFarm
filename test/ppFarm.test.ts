import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@openzeppelin/test-helpers";

describe("PPFarm", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let res: any;
  let ppFarm: Contract;
  let ppToken: Contract;
  let mockDai: Contract;

  const daiAmount: BigNumber = ethers.utils.parseEther("25000");

  beforeEach(async () => {
    const PPFarm = await ethers.getContractFactory("PPFarm");
    const PPToken = await ethers.getContractFactory("PPToken");
    const MockDai = await ethers.getContractFactory("MockERC20");
    mockDai = await MockDai.deploy("MockDai", "mDAI");
    [owner, alice, bob] = await ethers.getSigners();

    await Promise.all([
      mockDai.mint(owner.address, daiAmount),
      mockDai.mint(alice.address, daiAmount),
      mockDai.mint(bob.address, daiAmount),
    ]);

    ppToken = await PPToken.deploy();
    ppFarm = await PPFarm.deploy(mockDai.address, ppToken.address);
  });

  describe("Init", async () => {
    it("should initialize", async () => {
      expect(ppToken).to.be.ok;
      expect(ppFarm).to.be.ok;
      expect(mockDai).to.be.ok;
    });
  });

  describe("Stake", async () => {
    it("should accept DAI and update mapping", async () => {
      let toTransfer = ethers.utils.parseEther("100");
      await mockDai.connect(alice).approve(ppFarm.address, toTransfer);

      expect(await ppFarm.isStaking(alice.address)).to.eq(false);

      expect(await ppFarm.connect(alice).stake(toTransfer)).to.be.ok;

      expect(await ppFarm.stakingBalance(alice.address)).to.eq(toTransfer);

      expect(await ppFarm.isStaking(alice.address)).to.eq(true);
    });

    it("should update balance with multiple stakes", async () => {
      let toTransfer = ethers.utils.parseEther("100");
      await mockDai.connect(alice).approve(ppFarm.address, toTransfer);
      await ppFarm.connect(alice).stake(toTransfer);

      await mockDai.connect(alice).approve(ppFarm.address, toTransfer);
      await ppFarm.connect(alice).stake(toTransfer);

      expect(await ppFarm.stakingBalance(alice.address)).to.eq(
        ethers.utils.parseEther("200")
      );
    });

    it("should revert with not enough funds", async () => {
      let toTransfer = ethers.utils.parseEther("1000000");
      await mockDai.approve(ppFarm.address, toTransfer);

      await expect(ppFarm.connect(bob).stake(toTransfer)).to.be.revertedWith(
        "You cannot stake zero tokens"
      );
    });
  });
});
