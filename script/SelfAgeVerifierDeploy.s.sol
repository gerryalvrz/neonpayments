// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import {SelfAgeVerifier} from "contracts/SelfAgeVerifier.sol";

contract SelfAgeVerifierDeploy is Script {
    // Celo Sepolia Hub V2 provided by user
    address constant HUB_V2 = 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74;
    string constant SCOPE_SEED = "neon-pay";
    uint256 constant INITIAL_MIN_AGE = 18;

    function run() external {
        vm.startBroadcast();

        // Deploy verifier
        SelfAgeVerifier verifier = new SelfAgeVerifier(HUB_V2, SCOPE_SEED, INITIAL_MIN_AGE);

        vm.stopBroadcast();

        console2.log("SelfAgeVerifier deployed", address(verifier));
    }
}
