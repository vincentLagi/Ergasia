import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import { icrc1_ledger_canister } from "../../../declarations/icrc1_ledger_canister";
import { Token } from "../interface/Token";
import { Principal } from "@dfinity/principal";
import { User } from "../shared/types/User";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { Job } from "../shared/types/Job";

export async function getBalanceController(curr_user: User): Promise<Token> {
  // Data Sanitization
  let sanitizedSubAccount: [] | [Uint8Array] = [];
  if (curr_user.subAccount && curr_user.subAccount.length > 0) {
    const sub = curr_user.subAccount[0];
    if (sub instanceof Uint8Array) {
      sanitizedSubAccount = [sub];
    } else if (typeof sub === 'object' && sub !== null && !Array.isArray(sub)) {
      // It's a plain object, convert it
      const byteArray = Object.values(sub).filter((v): v is number => typeof v === 'number');
      sanitizedSubAccount = [new Uint8Array(byteArray)];
    }
  }

  const OwnerPrincipal = getPrincipalAddress();
  // Do NOT force Internet Identity login just to read balance.
  // Reading balance should not open II popup on navigation.

  const ledgerCanisterId = process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER;
  if (!ledgerCanisterId) {
    throw new Error("Ledger canister ID is not set in environment variables.");
  }

  const result = await projcet_backend_single.getBalance(curr_user.id, ledgerCanisterId);

  if ("ok" in result) {
    const tokenInfo = result.ok;
    const next_reuslt = await icrc1_ledger_canister.icrc1_balance_of({
      owner: OwnerPrincipal, // recipient principal
      subaccount: sanitizedSubAccount,
    });
    console.log("Balance:", next_reuslt);
    return {
      token_name: tokenInfo.token_name,
      token_symbol: tokenInfo.token_symbol,
      token_value: Number(next_reuslt) // convert bigint to number
    };
  } else {
    throw new Error(result.err);
  }
}

export function getPrincipalAddress(): Principal {
  return Principal.fromText("2vxsx-fae");
}

export async function topUpWalletController(curr_user: User, amount: number) {
  // Top-up requires signed transactions; only then we prompt II
  const authClient = await AuthClient.create();
  if (!await authClient.isAuthenticated()) {
    await authClient.login({ identityProvider: "https://identity.ic0.app/#authorize" });
  }
  
  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ identity });

  const OwnerPrincipal = getPrincipalAddress(); // Principal type

   const result = await icrc1_ledger_canister.icrc1_transfer({
    to: {
      owner: OwnerPrincipal, // recipient principal
      subaccount: curr_user.subAccount && curr_user.subAccount.length > 0 && curr_user.subAccount[0] ? [curr_user.subAccount[0]] : [],
    },
    fee: [], // None
    memo: [], // None
    from_subaccount: [], // None
    created_at_time: [], // None
    amount: BigInt(amount), // e.g., 1 token in e8s
  });

  console.log("Transfer result:", result);

  if ("Ok" in result) {
    const next_result = await projcet_backend_single.addBalanceTransaction(curr_user.id, amount);
    console.log("Add balance transaction result:", next_result);
    if("ok" in next_result) {
      return result.Ok;
    }else{
      throw new Error(
        "Failed to add balance transaction: "
      );
    }
    
  } else {
    throw new Error(
      "Transfer failed: " +
      JSON.stringify(result.Err, (_, v) => typeof v === "bigint" ? v.toString() : v)
    );

  }
}


export async function transferToJobController(curr_user: User, curr_job: Job, amount: number) : Promise<{ ok: string } | { err: string }> {
  // Transfer requires signed transactions; prompt II only here on demand
  const authClient = await AuthClient.create();
  if (!await authClient.isAuthenticated()) {
    await authClient.login({ identityProvider: "https://identity.ic0.app/#authorize" });
  }
  
  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ identity });

  const OwnerPrincipal = getPrincipalAddress(); // Principal type

   const result = await icrc1_ledger_canister.icrc1_transfer({
    to: {
      owner: OwnerPrincipal, // recipient principal
      subaccount: curr_job.subAccount && curr_job.subAccount.length > 0 && curr_job.subAccount[0] ? [curr_job.subAccount[0]] : [],
    },
    fee: [], // None
    memo: [], // None
    from_subaccount: curr_user.subAccount && curr_user.subAccount.length > 0 && curr_user.subAccount[0] ? [curr_user.subAccount[0]] : [],
    created_at_time: [], // None
    amount: BigInt(amount), // e.g., 1 token in e8s
  });

  console.log("Transfer result:", result);

  if ("Ok" in result) {
    // Backend logic for this is not yet implemented in the single canister
    const next_result = await projcet_backend_single.jobPaymentTranfer(curr_user.id, curr_job.id, amount);
    console.log("Add job transaction result:", next_result);
    if("ok" in next_result) {
      return { ok: result.Ok.toString() };
    }else{
      throw new Error(
        "Failed to histry transfer to job: " 
      );
    }
 
    
  } else {
    throw new Error(
      "Transfer failed: " +
      JSON.stringify(result.Err, (_, v) => typeof v === "bigint" ? v.toString() : v)
    );

  }
}


export async function transfertoWorkerController(job_id: string) {
  
  try {
    const job_result = await projcet_backend_single.getJob(job_id)
    if ("err" in job_result) {
      return { err: job_result.err }; // stop if job not found
    }

    const curr_job = job_result.ok
    const result = await projcet_backend_single.getJobAppliers(curr_job.id);


    if ("ok" in result) {
      const acceptedFreelancers = result.ok; // this is an array of { user: BackendUser, appliedAt: bigint }
      const OwnerPrincipal = await getPrincipalAddress();
      const count = acceptedFreelancers.length;
      if (count === 0) return { ok: true }; // No one to pay
      const amountPerFreelancer = Math.floor(Number(curr_job.jobSalary) / count);
      // Loop through freelancers and do transfers
      for (const freelancerData of acceptedFreelancers) {
        const freelancer = freelancerData.user;
        console.log("Freelancer:", freelancer);
        const transferResult = await icrc1_ledger_canister.icrc1_transfer({
          to: {
            owner: OwnerPrincipal, // recipient principal
            subaccount: freelancer.subAccount && freelancer.subAccount.length > 0 && freelancer.subAccount[0] ? [freelancer.subAccount[0]] : [],
          },
          fee: [], // None
          memo: [], // None
          from_subaccount: curr_job.subAccount && curr_job.subAccount.length > 0 && curr_job.subAccount[0] ? [curr_job.subAccount[0]] : [], // None
          created_at_time: [], // None
          amount: BigInt(amountPerFreelancer), // e.g., 1 token in e8s
        });


        if ("Ok" in transferResult) {
          // Backend logic for this is not yet implemented in the single canister
          // const next_result = await projcet_backend_single.workerPaymentTransfer(curr_job.id, freelancer.id ,amountPerFreelancer);
          // console.log("Add job transaction result:", next_result);
        }
        else {
          console.error(`Transfer to ${freelancer.id} failed:`, transferResult.Err);
          return { err: `Transfer to ${freelancer.id} failed: ${JSON.stringify(transferResult.Err)}` };
        }
        
      }

      return { ok: true };
    } else {
      console.error("Error from canister:", result.err);
      return { err: result.err };
    }
  } catch (err) {
    console.error("transfertoWorkerController error:", err);
    return { err: (err as Error).message };
  }
}
