// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

contract SelfAgeVerifier is SelfVerificationRoot, Ownable {
    bytes32 public verificationConfigId;
    uint256 public minAge;
    mapping(uint256 => bool) public nullifierUsed;
    mapping(address => bool) public verified;

    event AgeVerified(address indexed account, uint256 nullifier);
    event MinAgeUpdated(uint256 oldMinAge, uint256 newMinAge);

    constructor(address hubV2, string memory scopeSeed, uint256 initialMinAge)
        SelfVerificationRoot(hubV2, scopeSeed)
        Ownable(_msgSender())
    {
        minAge = initialMinAge;
        string[] memory forbidden = new string[](0);
        SelfUtils.UnformattedVerificationConfigV2 memory rawCfg = SelfUtils.UnformattedVerificationConfigV2({
            olderThan: initialMinAge,
            forbiddenCountries: forbidden,
            ofacEnabled: false
        });
        verificationConfigId = IIdentityVerificationHubV2(hubV2).setVerificationConfigV2(SelfUtils.formatVerificationConfigV2(rawCfg));
    }

    function setMinAge(uint256 newMinAge) external onlyOwner {
        uint256 old = minAge;
        minAge = newMinAge;
        string[] memory forbidden = new string[](0);
        SelfUtils.UnformattedVerificationConfigV2 memory rawCfg = SelfUtils.UnformattedVerificationConfigV2({
            olderThan: newMinAge,
            forbiddenCountries: forbidden,
            ofacEnabled: false
        });
        verificationConfigId = _identityVerificationHubV2.setVerificationConfigV2(SelfUtils.formatVerificationConfigV2(rawCfg));
        emit MinAgeUpdated(old, newMinAge);
    }

    function setConfigId(bytes32 configId) external onlyOwner {
        verificationConfigId = configId;
    }

    function getConfigId(bytes32, bytes32, bytes memory) public view override returns (bytes32) {
        return verificationConfigId;
    }

    function customVerificationHook(ISelfVerificationRoot.GenericDiscloseOutputV2 memory output, bytes memory) internal override {
        require(!nullifierUsed[output.nullifier], "AlreadyVerified");
        nullifierUsed[output.nullifier] = true;
        address user = address(uint160(output.userIdentifier));
        verified[user] = true;
        emit AgeVerified(user, output.nullifier);
    }

    function isVerified(address account) external view returns (bool) {
        return verified[account];
    }

    function revoke(address account) external onlyOwner {
        verified[account] = false;
    }
}
