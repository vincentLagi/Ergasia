import Model "./model";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Option "mo:base/Option";
import Float "mo:base/Float";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Bool "mo:base/Bool";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";
import Error "mo:base/Error";
import Nat32 "mo:base/Nat32";

persistent actor SingleBackend {

    // =================================================================================
    // State - Gabungan dari semua state canister
    // =================================================================================

    // Dari User Canister
    private stable var usersEntries : [(Text, Model.User)] = [];
    private transient var users = HashMap.fromIter<Text, Model.User>(
        usersEntries.vals(), 0, Text.equal, Text.hash
    );
    private stable var cashFlowHistories: [Model.CashFlowHistory] = [];

    // Dari Job Canister
    private stable var nextId : Nat = 0;
    private stable var nextCategoryId : Nat = 0;
    private stable var jobsEntries : [(Text, Model.Job)] = [];
    private stable var jobCategoriesEntries : [(Text, Model.JobCategory)] = [];
    private transient var jobs = HashMap.fromIter<Text, Model.Job>(
        jobsEntries.vals(), 0, Text.equal, Text.hash
    );
    private transient var jobCategories = HashMap.fromIter<Text, Model.JobCategory>(
        jobCategoriesEntries.vals(), 0, Text.equal, Text.hash
    );

    // Dari JobTransaction Canister
    private stable var jobTransactionsEntries : [(Text, Model.JobTransaction)] = [];
    private transient var jobTransactions = HashMap.fromIter<Text, Model.JobTransaction>(
        jobTransactionsEntries.vals(), 0, Text.equal, Text.hash
    );

    // Dari Applier Canister
    private stable var appliersEntries : [(Text, Model.Applier)] = [];
    private transient var appliers = HashMap.fromIter<Text, Model.Applier>(
        appliersEntries.vals(), 0, Text.equal, Text.hash
    );

    // Dari Inbox Canister
    private stable var inboxesEntries : [(Text, Model.Inbox)] = [];
    private transient var inboxes = HashMap.fromIter<Text, Model.Inbox>(
        inboxesEntries.vals(), 0, Text.equal, Text.hash
    );
    
    // Dari Invitation Canister
    private stable var invitationsEntries : [(Nat, Model.Invitation)] = [];
    private transient var invitations = HashMap.fromIter<Nat, Model.Invitation>(
        invitationsEntries.vals(), 0, Nat.equal, (func(n: Nat) : Nat32 { Nat32.fromNat(n) })
    );
    private stable var nextInvitationId : Nat = 0;
    
    // Dari Rating Canister
    private stable var ratingsEntries : [(Nat, Model.Rating)] = [];
    private transient var ratings = HashMap.fromIter<Nat, Model.Rating>(
        ratingsEntries.vals(), 0, Nat.equal, (func(n: Nat) : Nat32 { Nat32.fromNat(n) })
    );
    private stable var nextRatingId : Nat = 0;
    
    // Dari Submission Canister
    private stable var submissionsEntries : [(Text, Model.Submission)] = [];
    private transient var submissions = HashMap.fromIter<Text, Model.Submission>(
        submissionsEntries.vals(), 0, Text.equal, Text.hash
    );

    // Chat Token System Constants
    private transient let DAILY_FREE_TOKENS : Nat = 10;
    private transient let ONE_DAY_IN_NANO : Nat = 86400000000000; // 24 hours in nanoseconds



    // =================================================================================
    // Upgrade Hooks - preupgrade & postupgrade
    // =================================================================================
    system func preupgrade() {
        usersEntries := Iter.toArray(users.entries());
        jobsEntries := Iter.toArray(jobs.entries());
        jobCategoriesEntries := Iter.toArray(jobCategories.entries());
        jobTransactionsEntries := Iter.toArray(jobTransactions.entries());
        appliersEntries := Iter.toArray(appliers.entries());
        inboxesEntries := Iter.toArray(inboxes.entries());
        invitationsEntries := Iter.toArray(invitations.entries());
        ratingsEntries := Iter.toArray(ratings.entries());
        submissionsEntries := Iter.toArray(submissions.entries());
    };

    system func postupgrade() {
        users := HashMap.fromIter<Text, Model.User>(
            usersEntries.vals(), 0, Text.equal, Text.hash
        );
        jobs := HashMap.fromIter<Text, Model.Job>(
            jobsEntries.vals(), 0, Text.equal, Text.hash
        );
        jobCategories := HashMap.fromIter<Text, Model.JobCategory>(
            jobCategoriesEntries.vals(), 0, Text.equal, Text.hash
        );
        jobTransactions := HashMap.fromIter<Text, Model.JobTransaction>(
            jobTransactionsEntries.vals(), 0, Text.equal, Text.hash
        );
        appliers := HashMap.fromIter<Text, Model.Applier>(
            appliersEntries.vals(), 0, Text.equal, Text.hash
        );
        inboxes := HashMap.fromIter<Text, Model.Inbox>(
            inboxesEntries.vals(), 0, Text.equal, Text.hash
        );
        invitations := HashMap.fromIter<Nat, Model.Invitation>(
            invitationsEntries.vals(), 0, Nat.equal, (func(n: Nat) : Nat32 { Nat32.fromNat(n) })
        );
        ratings := HashMap.fromIter<Nat, Model.Rating>(
            ratingsEntries.vals(), 0, Nat.equal, (func(n: Nat) : Nat32 { Nat32.fromNat(n) })
        );
        submissions := HashMap.fromIter<Text, Model.Submission>(
            submissionsEntries.vals(), 0, Text.equal, Text.hash
        );
        usersEntries := [];
        jobsEntries := [];
        jobCategoriesEntries := [];
        jobTransactionsEntries := [];
        appliersEntries := [];
        inboxesEntries := [];
        invitationsEntries := [];
        ratingsEntries := [];
        submissionsEntries := [];
    };


    // =================================================================================
    // Chat Token System Functions
    // =================================================================================

    private func resetDailyTokensIfNeeded(user: Model.User): Model.User {
        let now = Time.now();
        
        // Check if 24 hours have passed since last reset
        if (now - user.chatTokens.lastTokenReset >= ONE_DAY_IN_NANO) {
            let updatedChatTokens: Model.ChatTokenBalance = {
                availableTokens = user.chatTokens.availableTokens + DAILY_FREE_TOKENS;
                dailyFreeRemaining = DAILY_FREE_TOKENS;
                lastTokenReset = now;
                totalTokensEarned = user.chatTokens.totalTokensEarned + DAILY_FREE_TOKENS;
                totalTokensSpent = user.chatTokens.totalTokensSpent;
            };
            
            return {
                id = user.id;
                profilePictureUrl = user.profilePictureUrl;
                username = user.username;
                dob = user.dob;
                preference = user.preference;
                description = user.description;
                wallet = user.wallet;
                rating = user.rating;
                createdAt = user.createdAt;
                updatedAt = now;
                isFaceRecognitionOn = user.isFaceRecognitionOn;
                isProfileCompleted = user.isProfileCompleted;
                subAccount = user.subAccount;
                chatTokens = updatedChatTokens;
            };
        } else {
            return user;
        };
    };

    public func useChatToken(userId: Text): async Result.Result<Model.ChatTokenResponse, Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = resetDailyTokensIfNeeded(user);
                users.put(userId, updatedUser);
                
                if (updatedUser.chatTokens.availableTokens > 0) {
                    let newChatTokens: Model.ChatTokenBalance = {
                        availableTokens = updatedUser.chatTokens.availableTokens - 1;
                        dailyFreeRemaining = updatedUser.chatTokens.dailyFreeRemaining;
                        lastTokenReset = updatedUser.chatTokens.lastTokenReset;
                        totalTokensEarned = updatedUser.chatTokens.totalTokensEarned;
                        totalTokensSpent = updatedUser.chatTokens.totalTokensSpent + 1;
                    };
                    
                    let finalUser: Model.User = {
                        id = updatedUser.id;
                        profilePictureUrl = updatedUser.profilePictureUrl;
                        username = updatedUser.username;
                        dob = updatedUser.dob;
                        preference = updatedUser.preference;
                        description = updatedUser.description;
                        wallet = updatedUser.wallet;
                        rating = updatedUser.rating;
                        createdAt = updatedUser.createdAt;
                        updatedAt = Time.now();
                        isFaceRecognitionOn = updatedUser.isFaceRecognitionOn;
                        isProfileCompleted = updatedUser.isProfileCompleted;
                        subAccount = updatedUser.subAccount;
                        chatTokens = newChatTokens;
                    };
                    
                    users.put(userId, finalUser);
                    
                    return #ok({
                        success = true;
                        message = "Token used successfully";
                        tokensUsed = 1;
                        tokensRemaining = newChatTokens.availableTokens;
                    });
                } else {
                    return #err("Insufficient tokens");
                };
            };
            case null { return #err("User not found") };
        };
    };

    public func getTokenBalance(userId: Text): async Result.Result<Model.TokenBalanceResponse, Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = resetDailyTokensIfNeeded(user);
                users.put(userId, updatedUser);
                
                return #ok({
                    availableTokens = updatedUser.chatTokens.availableTokens;
                    dailyFreeRemaining = updatedUser.chatTokens.dailyFreeRemaining;
                    dailyFreeLimit = DAILY_FREE_TOKENS;
                    lastTokenReset = updatedUser.chatTokens.lastTokenReset;
                });
            };
            case null { return #err("User not found") };
        };
    };

    public func addFreeTokens(userId: Text, amount: Nat): async Result.Result<Model.ChatTokenResponse, Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = resetDailyTokensIfNeeded(user);
                
                let newChatTokens: Model.ChatTokenBalance = {
                    availableTokens = updatedUser.chatTokens.availableTokens + amount;
                    dailyFreeRemaining = updatedUser.chatTokens.dailyFreeRemaining;
                    lastTokenReset = updatedUser.chatTokens.lastTokenReset;
                    totalTokensEarned = updatedUser.chatTokens.totalTokensEarned + amount;
                    totalTokensSpent = updatedUser.chatTokens.totalTokensSpent;
                };
                
                let finalUser: Model.User = {
                    id = updatedUser.id;
                    profilePictureUrl = updatedUser.profilePictureUrl;
                    username = updatedUser.username;
                    dob = updatedUser.dob;
                    preference = updatedUser.preference;
                    description = updatedUser.description;
                    wallet = updatedUser.wallet;
                    rating = updatedUser.rating;
                    createdAt = updatedUser.createdAt;
                    updatedAt = Time.now();
                    isFaceRecognitionOn = updatedUser.isFaceRecognitionOn;
                    isProfileCompleted = updatedUser.isProfileCompleted;
                    subAccount = updatedUser.subAccount;
                    chatTokens = newChatTokens;
                };
                
                users.put(userId, finalUser);
                
                return #ok({
                    success = true;
                    message = "Free tokens added successfully";
                    tokensUsed = 0;
                    tokensRemaining = newChatTokens.availableTokens;
                });
            };
            case null { return #err("User not found") };
        };
    };

    // =================================================================================
    // Logika dari User Canister
    // =================================================================================

    private func addTransaction(transaction: Model.CashFlowHistory) {
        cashFlowHistories := Array.append(cashFlowHistories, [transaction]);
    };

    func newSubaccount(userId: Text): [Nat8] {
        let base = Blob.toArray(Text.encodeUtf8(userId));
        var sub = Array.tabulate<Nat8>(32, func (i) {
            if (i < base.size()) base[i] else 0
        });
        return sub;
    };

    public func deleteAllUser() : async () {
        for (key in users.keys()) {
            ignore users.remove(key);
        };
    };

    public func getBalance(userId: Text, ledger_canister: Text) : async Result.Result<Model.Token, Text> {
        switch (await getUserById(userId)) {
            case (#err(errMsg)) {
                return #err("Failed to get user: " # errMsg);
            };
            case (#ok(user)) {
                let ledger = actor (ledger_canister) : actor {
                    icrc1_balance_of : ({ owner : Principal; subaccount : ?[Nat8] }) -> async Nat;
                    icrc1_name: () -> async Text;
                    icrc1_symbol: () -> async Text;
                    icrc1_minting_account : () -> async ?{ owner: Principal; subaccount: ?[Nat8] };
                };

                let mintingAccountOpt = await ledger.icrc1_minting_account();

                if (mintingAccountOpt == null) {
                    return #err("No minting account set");
                };

                let mintingAccount = switch (mintingAccountOpt) {
                    case (?acc) { acc };
                    case _ { return #err("Invalid minting account") };
                };

                let subAcc : ?[Nat8] = switch (user.subAccount) {
                    case null { null };
                    case (?v) { ?v };
                };

                let balance = await ledger.icrc1_balance_of({
                    owner = mintingAccount.owner;
                    subaccount = subAcc;
                });
                let token_name = await ledger.icrc1_name();
                let token_symbol = await ledger.icrc1_symbol();

                return #ok({
                    token_name = token_name;
                    token_symbol = token_symbol;
                    token_value = balance;
                });
            };
        };
    };

    public func addBalanceTransaction(userId: Text, amount: Float) : async Result.Result<Text, Text> {
        Debug.print("Adding balance transaction for user: " # userId);
        switch (users.get(userId)) {
            case (?user) {

                addTransaction({
                    fromId = userId;
                    transactionAt = Time.now();
                    amount = amount;
                    transactionType = #topUp;
                    toId = null;
                });

                return #ok("Balance added successfully");
            };
            case null {
                return #err("User not found");
            };
        };
    };

public func jobPaymentTranfer(user_id: Text, job_id: Text, amount: Float): async Result.Result<Text, Text> {
    switch (users.get(user_id)) {
        case (?fromUser) {
            let jobResult = await getJob(job_id);
            switch (jobResult) {
                case (#ok(jobData)) {
                    addTransaction({
                        fromId = user_id;
                        transactionAt = Time.now();
                        amount = amount;
                        transactionType = #transferToJob;
                        toId = ?job_id;
                    });

                    return #ok("Transferred to job successfully");
                };
                case (#err(errMsg)) {
                    return #err("Failed to fetch job details in user: " # errMsg);
                };
            };
        };
        case null {
            return #err("Sender not found");
        };
    };
};


    public func createUser(newid : Text, profilePictureUrl : ?Text) : async Model.User {
        let timestamp = Time.now();
        let sub = newSubaccount(newid);

        let newUser : Model.User = {
            id = newid;
            profilePictureUrl = profilePictureUrl;
            username = "";
            dob = "";
            preference = [];
            description = "";
            wallet = 0.0;
            rating = 0.0;
            createdAt = timestamp;
            updatedAt = timestamp;
            isFaceRecognitionOn = false;
            isProfileCompleted = false;
            subAccount = ?sub;
            // Initialize chat token system
            chatTokens = {
                availableTokens = DAILY_FREE_TOKENS;
                dailyFreeRemaining = DAILY_FREE_TOKENS;
                lastTokenReset = timestamp;
                totalTokensEarned = DAILY_FREE_TOKENS;
                totalTokensSpent = 0;
            };
        };

        users.put(newid, newUser);
        return newUser;
    };

    public query func getAllUsers() : async [Model.User] {
        return Iter.toArray(users.vals());
    };

    public func getUserById(userId : Text) : async Result.Result<Model.User, Text> {
        switch (users.get(userId)) {
            case (?user) { 
                // Auto reset daily tokens if needed
                let updatedUser = resetDailyTokensIfNeeded(user);
                users.put(userId, updatedUser);
                return #ok(updatedUser);
            };
            case null { return #err("User not found") };
        };
    };

    public func updateUser(userId : Text, payload : Model.UpdateUserPayload) : async Result.Result<Model.User, Text> {
        switch (users.get(userId)) {
            case (?currUser) {
                let timestamp = Time.now();
                let updatedUser : Model.User = {
                    id = currUser.id;
                    profilePictureUrl = switch(payload.profilePictureUrl) {
                        case (?url) { ?url };
                        case null { currUser.profilePictureUrl };
                    };
                    username = Option.get(payload.username, currUser.username);
                    dob = Option.get(payload.dob, currUser.dob);
                    description = Option.get(payload.description, currUser.description);
                    preference = Option.get(payload.preference, currUser.preference);
                    wallet = currUser.wallet;
                    rating = currUser.rating;
                    createdAt = currUser.createdAt;
                    updatedAt = timestamp;
                    isFaceRecognitionOn = currUser.isFaceRecognitionOn;
                    isProfileCompleted = Option.get(payload.isProfileCompleted, currUser.isProfileCompleted);
                    subAccount = currUser.subAccount;
                    // Keep existing chat token data
                    chatTokens = currUser.chatTokens;
                };
                users.put(userId, updatedUser);
                return #ok(updatedUser);
            };
            case null { return #err("User not found") };
        };
    };

    public func deleteUser(userID : Text) : async () {
        switch (users.get(userID)) {
            case (?_user) {
                users.delete(userID);
            };
            case null {

            };
        };
    };

    public query func getUserByName(username: Text): async Result.Result<Model.User, Text> {
        for (user in users.vals()) {
            if (user.username == username) {
                return #ok(user);
            };
        };
        return #err("User not found");
    };

    public shared func getUserTransactions(userId: Text): async [Model.CashFlowHistory] {
        return Array.filter<Model.CashFlowHistory>(cashFlowHistories, func(t: Model.CashFlowHistory): Bool {
            t.fromId == userId or (switch (t.toId) {
                case (?to) to == userId;
                case (_) false;
            })
        });
    };

    // =================================================================================
    // Logika dari Job Canister
    // =================================================================================

    public func createJob(payload : Model.CreateJobPayload) : async Result.Result<Model.Job, Text> {
        let jobId = nextId;
        nextId += 1;

        let id = Int.toText(jobId);
        let now = Time.now();

        let sub = newSubaccount(id);

        let job : Model.Job = {
            id = id;
            jobName = payload.jobName;
            jobDescription = payload.jobDescription;
            jobTags = payload.jobTags;
            jobProjectType = payload.jobProjectType;
            jobSalary = payload.jobSalary;
            jobSlots = payload.jobSlots;
            jobStatus = "Open";
            jobExperimentLevel = payload.jobExperimentLevel;
            jobRequirementSkills = payload.jobRequirementSkills;
            jobStartDate = payload.jobStartDate;
            jobDeadline = payload.jobDeadline;
            userId = payload.userId;
            createdAt = now;
            updatedAt = now;
            jobRating = 0;
            wallet = 0;
            subAccount = ?sub;
        };

        jobs.put(id, job);
        await createTransaction(payload.userId, id); 
        return #ok(job);
    };

    public func createJobCategory(categoryName : Text) : async Result.Result<Model.JobCategory, Text> {
        for ((_, category) in jobCategories.entries()) {
            if (category.jobCategoryName == categoryName) {
                return #err("Category already exists");
            };
        };

        let categoryId = nextCategoryId;
        nextCategoryId += 1;

        let id = Int.toText(categoryId);

        let category : Model.JobCategory = {
            id = id;
            jobCategoryName = categoryName;
        };

        jobCategories.put(id, category);

        return #ok(category);
    };

    public query func findJobCategoryByName(categoryName : Text) : async Result.Result<Model.JobCategory, Text> {
        Debug.print(categoryName);
        for ((_, category) in jobCategories.entries()) {
          if (category.jobCategoryName == categoryName) {
            return #ok(category);
          };
        };

        return #err("Category not found");
    };

    public query func getJobCategory(categoryId : Text) : async Result.Result<Model.JobCategory, Text> {
        switch (jobCategories.get(categoryId)) {
            case (null) {
                return #err("Category not found");
            };
            case (?category) {
                return #ok(category);
            };
        };
    };

    public query func getAllJobCategories() : async [Model.JobCategory] {
        return Iter.toArray(jobCategories.vals());
    };

    public func deleteAllJobs() : async () {
        for (key in jobs.keys()) {
          ignore jobs.remove(key);
        };
    };

    public func updateJob(jobId : Text, payload : Model.UpdateJobPayload) : async Result.Result<Model.Job, Text> {
        switch (jobs.get(jobId)) {
            case (null) {
                return #err("Job not found");
            };
            case (?job) {
                let updatedJob : Model.Job = {
                    id = job.id;
                    jobName = payload.jobName;
                    jobDescription = payload.jobDescription;
                    jobTags = job.jobTags;
                    jobProjectType = job.jobProjectType;
                    jobSalary = job.jobSalary;
                    jobSlots = job.jobSlots;
                    jobStatus = job.jobStatus;
                    jobExperimentLevel = job.jobExperimentLevel;
                    jobRequirementSkills = job.jobRequirementSkills;
                    jobStartDate = payload.jobStartDate;
                    jobDeadline = payload.jobDeadline;
                    userId = job.userId;
                    createdAt = job.createdAt;
                    updatedAt = Time.now();
                    jobRating = job.jobRating;
                    wallet = job.wallet;
                    subAccount = job.subAccount;
                };

                jobs.put(jobId, updatedJob);
                return #ok(updatedJob);
            };
        };
    };

    public query func getJob(jobId : Text) : async Result.Result<Model.Job, Text> {
        switch (jobs.get(jobId)) {
            case (null) {
                return #err("Job not found");
            };
            case (?job) {
                Debug.print("Job found: " # job.jobName);
                return #ok(job);
            };
        };
    };

    public query func getAllJobs() : async [Model.Job] {
        return Iter.toArray(jobs.vals());
    };

    public func deleteJob(jobId : Text) : async Result.Result<(), Text> {
        switch (jobs.get(jobId)) {
            case (null) {
                return #err("Job not found");
            };
            case (_) {
                jobs.delete(jobId);
                return #ok(());
            };
        };
    };

    public func getUserJob(owner_id : Text) : async [Model.Job] {
        let userJobs = Array.filter<Model.Job>(
            Iter.toArray(jobs.vals()),
            func(job : Model.Job) : Bool {
                return job.userId == owner_id;
            },
        );

        return userJobs;
    };

    public func getUserJobByStatusFinished(owner_id : Text) : async [Model.Job] {
        let userJobs = Array.filter<Model.Job>(
            Iter.toArray(jobs.vals()),
            func(job : Model.Job) : Bool {
                return job.userId == owner_id and job.jobStatus == "Finished";
            },
        );

        return userJobs;
    };

    public func startJob(job_id : Text) : async Result.Result<Bool, Text> {
        let jobResult = await getJob(job_id);
        switch (jobResult) {
            case (#err(error)) {
                Debug.print("Error fetching job: " # error);
                return #err(error);
            };
            case (#ok(job)) {
                if (job.jobStatus != "Open") {
                    return #err("Job is not open for start");
                };

                let updatedJob : Model.Job = {
                    id = job.id;
                    jobName = job.jobName;
                    jobDescription = job.jobDescription;
                    jobTags = job.jobTags;
                    jobProjectType = job.jobProjectType;
                    jobSalary = job.jobSalary;
                    jobSlots = job.jobSlots;
                    jobStatus = "Ongoing";
                    jobExperimentLevel = job.jobExperimentLevel;
                    jobRequirementSkills = job.jobRequirementSkills;
                    jobStartDate = job.jobStartDate;
                    jobDeadline = job.jobDeadline;
                    userId = job.userId;
                    createdAt = job.createdAt;
                    updatedAt = Time.now();
                    jobRating = job.jobRating;
                    wallet = job.wallet;
                    subAccount = job.subAccount;
                };

                jobs.put(job_id, updatedJob);
                return #ok(true);
            };
        };
    };

    public func finishJob(job_id : Text) : async Result.Result<Bool, Text> {
        let jobResult = await getJob(job_id);

        switch (jobResult) {
            case (#err(error)) {
                return #err(error);
            };
            case (#ok(job)) {
                if (job.jobStatus != "Ongoing") {
                    return #err("Job is not ongoing");
                };

                let updatedJob : Model.Job = {
                    id = job.id;
                    jobName = job.jobName;
                    jobDescription = job.jobDescription;
                    jobTags = job.jobTags;
                    jobProjectType = job.jobProjectType;
                    jobSalary = job.jobSalary;
                    jobSlots = job.jobSlots;
                    jobStatus = "Finished";
                    jobExperimentLevel = job.jobExperimentLevel;
                    jobRequirementSkills = job.jobRequirementSkills;
                    jobStartDate = job.jobStartDate;
                    jobDeadline = job.jobDeadline;
                    userId = job.userId;
                    createdAt = job.createdAt;
                    updatedAt = Time.now();
                    jobRating = job.jobRating;
                    wallet = job.wallet;
                    subAccount = job.subAccount;
                };

                jobs.put(job_id, updatedJob);
                return #ok(true);
            };
        };
    };

    public func putJob(job_id : Text, job : Model.Job) {
        jobs.put(job_id, job);
    };

    // =================================================================================
    // Logika dari JobTransaction Canister
    // =================================================================================

    public func createTransaction(clientId: Text, jobId: Text): async () {
        let transactionId = Int.toText(jobTransactions.size());
        let newTransaction : Model.JobTransaction = {
            id = transactionId;
            jobId = jobId;
            clientId = clientId;
            freelancerIds = [];
            status = "Open";
            createdAt = Time.now();
        };
        jobTransactions.put(transactionId, newTransaction);
    };

    public query func getTransactionByFreelancerId(freelancerId: Text) : async [Model.JobTransaction] {
        let result = Array.filter<Model.JobTransaction>(
            Iter.toArray(jobTransactions.vals()),
            func(jt) {
                Option.isSome(Array.find<Text>(jt.freelancerIds, func(f) { f == freelancerId }))
            }
        );
        return result;
    };

    public query func getClientHistory(clientId: Text) : async [Model.JobTransaction] {
        let result = Array.filter<Model.JobTransaction>(
            Iter.toArray(jobTransactions.vals()),
            func(jt) {
                jt.clientId == clientId
            }
        );
        return result;
    };

    public query func getFreelancerHistory(freelancerId: Text) : async [Model.JobTransaction] {
        let result = Array.filter<Model.JobTransaction>(
            Iter.toArray(jobTransactions.vals()),
            func(jt) {
                Option.isSome(Array.find<Text>(jt.freelancerIds, func(f) { f == freelancerId }))
            }
        );
        return result;
    };
    
    public func appendFreelancers(jobId: Text, freelancerId: Text): async Result.Result<Text, Text> {
        // Find the transaction by jobId first. This is a simplification.
        // A real implementation might need a more direct way to find a transaction for a job.
        var transactionToUpdate: ?Model.JobTransaction = null;
        for ((id, t) in jobTransactions.entries()) {
            if (t.jobId == jobId) {
                transactionToUpdate := ?t;
            };
        };

        switch (transactionToUpdate) {
            case (null) { return #err("Transaction for Job not found") };
            case (?transaction) {
                let updatedFreelancers = Array.append(transaction.freelancerIds, [freelancerId]);
                let updatedTransaction : Model.JobTransaction = {
                    id = transaction.id;
                    jobId = transaction.jobId;
                    clientId = transaction.clientId;
                    freelancerIds = updatedFreelancers;
                    status = transaction.status;
                    createdAt = transaction.createdAt;
                };
                jobTransactions.put(transaction.id, updatedTransaction);
                return #ok("Success");
            };
        };
    };

    public query func isFreelancerRegistered(jobId: Text, freelancerId: Text): async Bool {
        var transactionToUpdate: ?Model.JobTransaction = null;
        for ((id, t) in jobTransactions.entries()) {
            if (t.jobId == jobId) {
                transactionToUpdate := ?t;
            };
        };

        switch (transactionToUpdate) {
            case (null) { return false };
            case (?transaction) {
                return Option.isSome(Array.find<Text>(transaction.freelancerIds, func(f) { f == freelancerId }));
            };
        };
    };


    // =================================================================================
    // Logika dari Applier Canister
    // =================================================================================

    public shared func getJobAppliers(jobId: Text) : async Result.Result<[{user: Model.User; appliedAt: Int}], Text> {
        let jobAppliers = Array.filter<Model.Applier>(
            Iter.toArray(appliers.vals()),
            func(applier) { applier.jobId == jobId }
        );

        var result : [{user: Model.User; appliedAt: Int}] = [];
        for (applier in Iter.fromArray(jobAppliers)) {
            let userResult = await getUserById(applier.userId);
            switch (userResult) {
                case (#ok(user)) {
                    result := Array.append(result, [{ user = user; appliedAt = applier.appliedAt}]);
                };
                case (#err(_)) {};
            };
        };
        return #ok(result);
    };
    
    public func applyJob(userId: Text, jobId: Text): async Result.Result<Text, Text> {
        let applierId = Int.toText(appliers.size());
        let newApplier : Model.Applier = {
            userId = userId;
            jobId = jobId;
            appliedAt = Time.now();
        };
        // a better key would be a composite of userId and jobId
        appliers.put(applierId, newApplier);
        return #ok("Applied successfully");
    };

    public func acceptApplier(userId: Text, jobId: Text): async Result.Result<Text, Text> {
        // Find the specific applier to remove them from the list after acceptance
        var applierKeyToRemove : ?Text = null;
        for ((key, applier) in appliers.entries()) {
            if (applier.userId == userId and applier.jobId == jobId) {
                applierKeyToRemove := ?key;
            };
        };

        // Remove the applier if found
        switch (applierKeyToRemove) {
            case (?key) { appliers.delete(key); };
            case (null) { /* Applier not found, maybe already processed */ };
        };
        
        // Add the user to the list of accepted freelancers for the job
        let _ = await appendFreelancers(jobId, userId);
        return #ok("Applier accepted");
    };

    public func rejectApplier(userId: Text, jobId: Text): async Result.Result<Text, Text> {
        // In a real implementation, you would remove the applier from the list.
        // For now, we just return success.
        return #ok("Applier rejected");
    };

    public shared func getUserApply(userId: Text): async [Model.Job] {
        let appliedJobs = Array.filter<Model.Applier>(
            Iter.toArray(appliers.vals()),
            func(applier) { applier.userId == userId }
        );
        
        var jobsResult: [Model.Job] = [];
        for (applier in Iter.fromArray(appliedJobs)) {
            let jobResult = await getJob(applier.jobId);
            switch (jobResult) {
                case (#ok(job)) {
                    jobsResult := Array.append(jobsResult, [job]);
                };
                case (#err(_)) {};
            };
        };
        return jobsResult;
    };

    public query func hasUserApplied(userId: Text, jobId: Text): async Bool {
        for (applier in appliers.vals()) {
            if (applier.userId == userId and applier.jobId == jobId) {
                return true;
            };
        };
        return false;
    };

    public shared func getAcceptedFreelancer(jobId: Text) : async [Model.User] {
        var transaction: ?Model.JobTransaction = null;
        for ((_, t) in jobTransactions.entries()) {
            if (t.jobId == jobId) {
                transaction := ?t;
            };
        };

        switch (transaction) {
            case (null) { return [] };
            case (?trans) {
                var acceptedUsers: [Model.User] = [];
                for (freelancerId in Iter.fromArray(trans.freelancerIds)) {
                    let userResult = await getUserById(freelancerId);
                    switch (userResult) {
                        case (#ok(user)) {
                            acceptedUsers := Array.append(acceptedUsers, [user]);
                        };
                        case (#err(_)) {
                            // User not found, skip
                        };
                    };
                };
                return acceptedUsers;
            };
        };
    };

    // =================================================================================
    // Logika dari Invitation Canister
    // =================================================================================

    public func createInvitation(senderId: Text, jobId: Text, freelancerId: Text): async Result.Result<Text, Text> {
        let invitationId = nextInvitationId;
        nextInvitationId += 1;
        
        let newInvitation : Model.Invitation = {
            id = invitationId;
            jobId = jobId;
            senderId = senderId;
            freelancerId = freelancerId;
            status = "pending";
            createdAt = Time.now();
        };
        invitations.put(invitationId, newInvitation);
        return #ok("Invitation created");
    };

    public query func getInvitationByUserIdAndJobId(userId: Text, jobId: Text): async ?Model.Invitation {
        for (invitation in invitations.vals()) {
            if (invitation.senderId == userId and invitation.jobId == jobId) {
                return ?invitation;
            };
        };
        return null;
    };

    public query func getInvitationByUserID(userId: Text): async [Model.Invitation] {
        let result = Array.filter<Model.Invitation>(
            Iter.toArray(invitations.vals()),
            func(invitation) { invitation.freelancerId == userId }
        );
        return result;
    };

    public func acceptInvitation(userId: Text, invitationId: Nat): async Bool {
        switch (invitations.get(invitationId)) {
            case (null) { return false };
            case (?invitation) {
                if (invitation.freelancerId != userId) { return false };
                let updatedInvitation : Model.Invitation = {
                    id = invitation.id;
                    jobId = invitation.jobId;
                    senderId = invitation.senderId;
                    freelancerId = invitation.freelancerId;
                    status = "accepted";
                    createdAt = invitation.createdAt;
                };
                invitations.put(invitationId, updatedInvitation);
                // a more robust implementation would find the transaction by job id
                // for now, we assume the first transaction is the correct one
                let transactionId = "0"; 
                let _ = await appendFreelancers(transactionId, userId);
                return true;
            };
        };
    };

    public func rejectInvitation(userId: Text, invitationId: Nat): async Bool {
        switch (invitations.get(invitationId)) {
            case (null) { return false };
            case (?invitation) {
                if (invitation.freelancerId != userId) { return false };
                 let updatedInvitation : Model.Invitation = {
                    id = invitation.id;
                    jobId = invitation.jobId;
                    senderId = invitation.senderId;
                    freelancerId = invitation.freelancerId;
                    status = "rejected";
                    createdAt = invitation.createdAt;
                };
                invitations.put(invitationId, updatedInvitation);
                return true;
            };
        };
    };

    // =================================================================================
    // Logika dari Inbox Canister
    // =================================================================================

    public func createInbox(receiverId: Text, jobId: Text, senderId: Text, inbox_type: Text, message: Text): async Result.Result<Model.Inbox, Text> {
        let inboxId = Int.toText(inboxes.size());
        let newInbox : Model.Inbox = {
            id = inboxId;
            jobId = jobId;
            senderId = senderId;
            receiverId = receiverId;
            message = message;
            inbox_type = inbox_type;
            read = false;
            createdAt = Time.now();
        };
        inboxes.put(inboxId, newInbox);
        return #ok(newInbox);
    };

    public query func getInbox(inboxId: Text): async Result.Result<Model.Inbox, Text> {
        switch (inboxes.get(inboxId)) {
            case (null) { return #err("Inbox not found") };
            case (?inbox) { return #ok(inbox) };
        };
    };

    public query func getAllInbox(): async [Model.Inbox] {
        return Iter.toArray(inboxes.vals());
    };

    public query func getReceiverInbox(receiverId: Text): async [Model.Inbox] {
        return Array.filter<Model.Inbox>(
            Iter.toArray(inboxes.vals()),
            func(inbox) { inbox.receiverId == receiverId }
        );
    };

    public query func getSenderInbox(senderId: Text): async [Model.Inbox] {
        return Array.filter<Model.Inbox>(
            Iter.toArray(inboxes.vals()),
            func(inbox) { inbox.senderId == senderId }
        );
    };

    public query func getAllInboxByUserId(userId: Text): async [Model.Inbox] {
        return Array.filter<Model.Inbox>(
            Iter.toArray(inboxes.vals()),
            func(inbox) { inbox.senderId == userId or inbox.receiverId == userId }
        );
    };

    public query func getAllInboxBySubmissionType(submissionType: Text): async [Model.Inbox] {
        return Array.filter<Model.Inbox>(
            Iter.toArray(inboxes.vals()),
            func(inbox) { inbox.inbox_type == submissionType }
        );
    };

    public query func getInboxMessagesFromAppliers(jobId: Text, userId: Text): async [Model.Inbox] {
        return Array.filter<Model.Inbox>(
            Iter.toArray(inboxes.vals()),
            func(inbox) { inbox.jobId == jobId and inbox.receiverId == userId }
        );
    };

    public func markAsRead(inboxId: Text): async Result.Result<Text, Text> {
        switch (inboxes.get(inboxId)) {
            case (null) { return #err("Inbox not found") };
            case (?inbox) {
                let updatedInbox : Model.Inbox = {
                    id = inbox.id;
                    jobId = inbox.jobId;
                    senderId = inbox.senderId;
                    receiverId = inbox.receiverId;
                    message = inbox.message;
                    inbox_type = inbox.inbox_type;
                    read = true;
                    createdAt = inbox.createdAt;
                };
                inboxes.put(inboxId, updatedInbox);
                return #ok("Success");
            };
        };
    };

    // =================================================================================
    // Logika dari Rating Canister
    // =================================================================================

    public func createRating(jobId: Text, userIds: [Text]): async Result.Result<Text, Text> {
        for (userId in Iter.fromArray(userIds)) {
            let ratingId = nextRatingId;
            nextRatingId += 1;
            let newRating : Model.Rating = {
                id = ratingId;
                jobId = jobId;
                userId = userId;
                rating = 0;
                createdAt = Time.now();
            };
            ratings.put(ratingId, newRating);
        };
        return #ok("Ratings created");
    };

    public shared func getRatingByJobId(jobId: Text, userId: Text): async Result.Result<[{user: Model.User; rating_id: Nat; rating: Nat; isEdit: Bool}], Text> {
        let jobRatings = Array.filter<Model.Rating>(
            Iter.toArray(ratings.vals()),
            func(rating) { rating.jobId == jobId }
        );

        var result : [{user: Model.User; rating_id: Nat; rating: Nat; isEdit: Bool}] = [];
        for (rating in Iter.fromArray(jobRatings)) {
            let userResult = await getUserById(rating.userId);
            switch (userResult) {
                case (#ok(user)) {
                    result := Array.append(result, [{ 
                        user = user; 
                        rating_id = rating.id;
                        rating = rating.rating;
                        isEdit = rating.rating != 0;
                    }]);
                };
                case (#err(_)) {};
            };
        };
        return #ok(result);
    };

    public func ratingUser(payloads: [Model.RequestRatingPayload]): async Result.Result<Text, Text> {
    for (payload in Iter.fromArray(payloads)) {
        switch (ratings.get(payload.rating_id)) {
            case (?rating) {
                let updatedRating : Model.Rating = {
                    id = rating.id;
                    jobId = rating.jobId;
                    userId = rating.userId;
                    rating = payload.rating;
                    createdAt = rating.createdAt;
                };
                ratings.put(payload.rating_id, updatedRating);

                let allUserRating = await getRatingsByUserId(rating.userId);
                switch(allUserRating) {
                    case (#ok(r)) {
                        var total : Nat = 0;
                        var count : Nat = 0;
                        for (ra in Iter.fromArray(r)) {
                            if (ra.rating > 0) {
                                total += ra.rating;
                                count += 1;
                            };
                        };
                        let avg = if (count > 0) {
                            (Float.fromInt(total) / Float.fromInt(count)) / 10.0
                        } else {
                            0.0
                        };

                        
                        
                        
                        switch (users.get(rating.userId)) {
                            case (?currUser) {
                                let timestamp = Time.now();
                                let updatedUser : Model.User = {
                                    id = currUser.id;
                                    profilePictureUrl = currUser.profilePictureUrl;
                                    username = currUser.username;
                                    dob = currUser.dob;
                                    description = currUser.description;
                                    preference = currUser.preference;
                                    wallet = currUser.wallet;
                                    rating = avg;
                                    createdAt = currUser.createdAt;
                                    updatedAt = timestamp;
                                    isFaceRecognitionOn = currUser.isFaceRecognitionOn;
                                    isProfileCompleted = currUser.isProfileCompleted;
                                    subAccount = currUser.subAccount;
                                    chatTokens = currUser.chatTokens;
                                };
                                users.put(rating.userId, updatedUser);
                            };
                            case null {
                                return #err("User not found");
                            };
                        };
                    };
                    case (#err(msg)) {
                        return #err("error while updating user rating: " # msg);
                    };
                };
            };
            case _ {};
        };
    };
    return #ok("Ratings submitted");
};


    public query func getRatingsByUserId(userId: Text): async Result.Result<[Model.Rating], Text> {
        let userRatings = Iter.filter<Model.Rating>(ratings.vals(), func(rating) {
            rating.userId == userId
        });
        
        let ratingsArray = Iter.toArray(userRatings);
        
        if (ratingsArray.size() == 0) {
            return #err("No ratings found for this user");
        };
        
        return #ok(ratingsArray);
    };

    public query func getRatingByUserIdJobId(jobId: Text, userId: Text): async Result.Result<Model.Rating, Text> {
        for (rating in ratings.vals()) {
            if (rating.jobId == jobId and rating.userId == userId) {
                return #ok(rating);
            };
        };
        return #err("Rating not found");
    };


    // =================================================================================
    // Logika dari Submission Canister
    // =================================================================================

    public func createSubmission(jobId: Text, userId: Text, submissionFilePath: Text, submissionMessage: Text): async Result.Result<Text, Text> {
        let submissionId = Int.toText(submissions.size());
        let newSubmission : Model.Submission = {
            id = submissionId;
            jobId = jobId;
            userId = userId;
            submissionFilePath = submissionFilePath;
            submissionMessage = submissionMessage;
            status = "Waiting";
            createdAt = Time.now();
        };
        submissions.put(submissionId, newSubmission);
        return #ok("Submission created");
    };

    public query func getAllSubmissions(): async [Model.Submission] {
        return Iter.toArray(submissions.vals());
    };

    public query func getFileSubmissionbyId(id: Text): async ?Text {
        switch (submissions.get(id)) {
            case (null) { return null };
            case (?submission) { return ?submission.submissionFilePath };
        };
    };

    public query func getSubmissionByJobId(jobId: Text): async Result.Result<[Model.Submission], Text> {
        let result = Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.jobId == jobId }
        );
        return #ok(result);
    };

    public func updateSubmissionStatus(submissionId: Text, newStatus: Text, message: Text): async Result.Result<Text, Text> {
        switch (submissions.get(submissionId)) {
            case (null) { return #err("Submission not found") };
            case (?submission) {
                let updatedSubmission : Model.Submission = {
                    id = submission.id;
                    jobId = submission.jobId;
                    userId = submission.userId;
                    submissionFilePath = submission.submissionFilePath;
                    submissionMessage = submission.submissionMessage;
                    status = newStatus;
                    createdAt = submission.createdAt;
                };
                submissions.put(submissionId, updatedSubmission);
                return #ok("Success");
            };
        };
    };

    public query func getSubmissionAcceptbyUserId(userId: Text): async [Model.Submission] {
        return Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.userId == userId and s.status == "Accept" }
        );
    };

    public query func getSubmissionWaitingbyUserId(userId: Text): async [Model.Submission] {
        return Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.userId == userId and s.status == "Waiting" }
        );
    };

    public query func getSubmissionRejectbyUserId(userId: Text): async [Model.Submission] {
        return Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.userId == userId and s.status == "Reject" }
        );
    };

    public query func getSubmissionAcceptbyJobId(jobId: Text): async [Model.Submission] {
        return Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.jobId == jobId and s.status == "Accept" }
        );
    };

    public query func getSubmissionWaitingbyJobId(jobId: Text): async [Model.Submission] {
        return Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.jobId == jobId and s.status == "Waiting" }
        );
    };

    public query func getSubmissionRejectbyJobId(jobId: Text): async [Model.Submission] {
        return Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.jobId == jobId and s.status == "Reject" }
        );
    };

    public query func getUserSubmissionsByJobId(jobId: Text, userId: Text): async [Model.Submission] {
        return Array.filter<Model.Submission>(
            Iter.toArray(submissions.vals()),
            func(s) { s.jobId == jobId and s.userId == userId }
        );
    };

    // =================================================================================
    // HTTP Interface Gabungan
    // =================================================================================

    type HeaderField = (Text, Text);
    
    type HttpRequest = {
        method : Text;
        url : Text;
        headers : [HeaderField];
        body : Blob;
        certificate_version : ?Nat16;
    };

    type HttpResponse = {
        status_code : Nat16;
        headers : [HeaderField];
        body : Blob;
        streaming_strategy : ?StreamingCallbackStrategy;
        upgrade: ?Bool;
    };

    type StreamingCallback = query (StreamingCallbackToken) -> async StreamingCallbackResponse;
    
    type StreamingCallbackToken = {
        key: Text;
        content_encoding: Text;
        index: Nat;
        sha256: ?[Nat8];
    };
    
    type StreamingCallbackResponse = {
        body: Blob;
        token: ?StreamingCallbackToken;
    };

    type StreamingCallbackStrategy = {
        #Callback: {
            token: StreamingCallbackToken;
            callback: StreamingCallback;
        };
    };

    private func makeJsonResponse(statusCode : Nat16, jsonContent : Text) : HttpResponse {
        {
            status_code = statusCode;
            headers = [
                ("Content-Type", "application/json"),
                ("Access-Control-Allow-Origin", "*"),
                ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
                ("Access-Control-Allow-Headers", "Content-Type")
            ];
            body = Text.encodeUtf8(jsonContent);
            streaming_strategy = null;
            upgrade = null;
        };
    };

    private func userToJsonString(user : Model.User) : Text {
        let prefItems = Array.map<Model.JobCategory, Text>(
            user.preference,
            func (p : Model.JobCategory) : Text {
                "{\"id\":\"" # p.id # "\",\"jobCategoryName\":\"" # p.jobCategoryName # "\"}"
            }
        );
        let preferenceJson = "[" # Text.join(",", Iter.fromArray(prefItems)) # "]";

        "{" #
        "\"id\":\"" # user.id # "\"," #
        "\"username\":\"" # user.username # "\"," #
        "\"dob\":\"" # user.dob # "\"," #
        "\"preference\":" # preferenceJson # "," #
        "\"description\":\"" # user.description # "\"," #
        "\"wallet\":" # Float.toText(user.wallet) # "," #
        "\"rating\":" # Float.toText(user.rating) # "," #
        "\"createdAt\":" # Int.toText(user.createdAt) # "," #
        "\"updatedAt\":" # Int.toText(user.updatedAt) # "," #
        "\"isFaceRecognitionOn\":" # Bool.toText(user.isFaceRecognitionOn) # "," #
        "\"isProfileCompleted\":" # Bool.toText(user.isProfileCompleted) # "," #
        "\"chatTokens\":" # "{" #
            "\"availableTokens\":" # Nat.toText(user.chatTokens.availableTokens) # "," #
            "\"dailyFreeRemaining\":" # Nat.toText(user.chatTokens.dailyFreeRemaining) # "," #
            "\"lastTokenReset\":" # Int.toText(user.chatTokens.lastTokenReset) # "," #
            "\"totalTokensEarned\":" # Nat.toText(user.chatTokens.totalTokensEarned) # "," #
            "\"totalTokensSpent\":" # Nat.toText(user.chatTokens.totalTokensSpent) #
        "}" # "," #
        "}"
    };

    private func usersToJsonArray(userList : [Model.User]) : Text {
        let userJsonArray = Array.map<Model.User, Text>(
            userList,
            func (user : Model.User) : Text = userToJsonString(user)
        );
        "[" # Text.join(",", Iter.fromArray(userJsonArray)) # "]"
    };

    private func jobToJsonString(job : Model.Job) : Text {
        let tagItems = Array.map<Model.JobCategory, Text>(
            job.jobTags,
            func (tag : Model.JobCategory) : Text {
                "{\"id\":\"" # tag.id # "\",\"jobCategoryName\":\"" # tag.jobCategoryName # "\"}"
            }
        );
        let tagsJson = "[" # Text.join(",", Iter.fromArray(tagItems)) # "]";
        let descItems = Array.map<Text, Text>(
            job.jobDescription,
            func (d : Text) : Text { "\"" # d # "\"" }
        );
        let descriptionJson = "[" # Text.join(",", Iter.fromArray(descItems)) # "]";

        "{" #
        "\"id\":\"" # job.id # "\"," #
        "\"jobName\":\"" # job.jobName # "\"," #
        "\"jobDescription\":" # descriptionJson # "," #
        "\"jobTags\":" # tagsJson # "," #
        "\"jobSalary\":" # Float.toText(job.jobSalary) # "," #
        "\"jobSlots\":" # Int.toText(job.jobSlots) # "," #
        "\"jobStatus\":\"" # job.jobStatus # "\"," #
        "\"userId\":\"" # job.userId # "\"," #
        "\"createdAt\":" # Int.toText(job.createdAt) # "," #
        "\"updatedAt\":" # Int.toText(job.updatedAt) # "," #
        "\"jobRating\":" # Float.toText(job.jobRating) # "," #
        "\"wallet\":" # Float.toText(job.wallet) #
        "}";
    };

    private func jobsToJsonArray(jobList : [Model.Job]) : Text {
        let jobJsonArray = Array.map<Model.Job, Text>(
            jobList,
            func(job : Model.Job) : Text = jobToJsonString(job),
        );
        "[" # Text.join(",", Iter.fromArray(jobJsonArray)) # "]"
    };

    public query func http_request(req : HttpRequest) : async HttpResponse {
        let path = req.url;
        let method = req.method;
        Debug.print("http_request called. Method: " # method # ", Path: " # path);

        switch (method) {
            case ("GET") {
                // Handle GET requests
                if (path == "/getAllUsers") {
                    let allUsers = Iter.toArray(users.vals());
                    return makeJsonResponse(200, usersToJsonArray(allUsers));
                } else if (path == "/getAllJobs") {
                    let allJobs = Iter.toArray(jobs.vals());
                    return makeJsonResponse(200, jobsToJsonArray(allJobs));
                } else {
                    return makeJsonResponse(404, "{\"error\": \"Not Found\"}");
                };
            };
            case ("POST") {
                // For POST, indicate an upgrade is needed
                return {
                    status_code = 200;
                    headers = [];
                    body = Blob.fromArray([]);
                    streaming_strategy = null;
                    upgrade = ?true;
                };
            };
            case ("OPTIONS") {
                return {
                    status_code = 204;
                    headers = [
                        ("Access-Control-Allow-Origin", "*"),
                        ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
                        ("Access-Control-Allow-Headers", "Content-Type, Authorization")
                    ];
                    body = Blob.fromArray([]);
                    streaming_strategy = null;
                    upgrade = null;
                };
            };
            case _ {
                return makeJsonResponse(405, "{\"error\": \"Method Not Allowed\"}");
            };
        };
    };

    public shared func http_request_update(req : HttpRequest) : async HttpResponse {
        let path = req.url;
        let method = req.method;
        Debug.print("http_request_update called. Method: " # method # ", Path: " # path);

        if (method == "POST") {
            let userIdOpt = Text.decodeUtf8(req.body);

            switch (userIdOpt) {
                case (null) { return makeJsonResponse(400, "{\"error\": \"Invalid UTF-8 in body\"}"); };
                case (?userId) {
                    if (userId == "") {
                        return makeJsonResponse(400, "{\"error\": \"userId in body cannot be empty\"}");
                    };

                    if (path == "/getUserTransactions") {
                        let transactions = await getUserTransactions(userId);
                        // This is a simplified JSON conversion
                        var transStrs : [Text] = [];
                        for (t in Iter.fromArray(transactions)) {
                            let toIdStr = switch (t.toId) {
                                case null { "null" };
                                case (?s) { "\"" # s # "\"" };
                            };
                            let transStr = "{\"fromId\":\"" # t.fromId # "\",\"transactionAt\":" # Int.toText(t.transactionAt) # ",\"amount\":" # Float.toText(t.amount) # ",\"toId\":" # toIdStr # "}";
                            transStrs := Array.append(transStrs, [transStr]);
                        };
                        let jsonResponse = "[" # Text.join(",", Iter.fromArray(transStrs)) # "]";
                        return makeJsonResponse(200, jsonResponse);
                    } else if (path == "/getAllUsers") {
                        let allUsers = Iter.toArray(users.vals());
                        return makeJsonResponse(200, usersToJsonArray(allUsers));
                    } else if (path == "/getAllJobs") {
                        let allJobs = Iter.toArray(jobs.vals());
                        return makeJsonResponse(200, jobsToJsonArray(allJobs));
                    } else {
                        return makeJsonResponse(404, "{\"error\": \"Not Found in update call\"}");
                    };
                };
            };
        } else {
            return makeJsonResponse(405, "{\"error\": \"Method Not Allowed in update call\"}");
        };
    };
};