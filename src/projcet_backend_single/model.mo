import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Float "mo:base/Float";

module {
    // Tipe dari Job/model.mo
    public type Job = {
        id: Text;
        jobName: Text;
        jobDescription: [Text];
        jobSalary: Float;
        jobRating: Float;
        jobTags: [JobCategory];
        jobProjectType: Text;
        jobSlots: Int;
        jobStatus: Text;
        jobExperimentLevel: Text;
        jobRequirementSkills: [Text];
        jobStartDate: Int;
        jobDeadline: Int;
        userId: Text;
        createdAt: Int;
        updatedAt: Int;
        wallet: Float;
        subAccount: ?[Nat8];
    };

    public type JobCategory = {
        id: Text;
        jobCategoryName: Text;
    };

    public type CreateJobPayload = {
        jobName: Text;
        jobDescription: [Text];
        jobSalary: Float;
        jobTags: [JobCategory];
        jobProjectType: Text;
        jobSlots: Int;
        userId: Text;
        jobRequirementSkills: [Text];
        jobExperimentLevel: Text;
        jobStartDate: Int;
        jobDeadline: Int;
        jobStatus: Text;
    };

    public type UpdateJobPayload = {
        jobName: Text;
        jobDescription: [Text];
        jobStartDate: Int;
        jobDeadline: Int;
    };

    // Tipe dari User/model.mo
    public type User = {
        id: Text;
        profilePictureUrl: ?Text; // Changed from Blob to optional Text URL
        username: Text;
        dob: Text;
        preference: [JobCategory]; // Menggunakan JobCategory yang sudah didefinisikan di atas
        description: Text;
        wallet: Float;
        rating: Float;
        createdAt: Int;
        updatedAt: Int;
        isFaceRecognitionOn: Bool;
        isProfileCompleted: Bool;
        subAccount: ?[Nat8];
        // Chat Token System
        chatTokens: ChatTokenBalance;
    };

    public type UpdateUserPayload = {
        username: ?Text;
        profilePictureUrl: ?Text; // Changed from Blob to Text URL
        description: ?Text;
        dob : ?Text;
        preference: ?[JobCategory]; // Menggunakan JobCategory yang sudah didefinisikan di atas
        isProfileCompleted: ?Bool;
    };

    public type TransactionType = {
        #topUp;
        #transfer;
        #transferToJob;
    };

    public type Token ={
        token_name: Text;
        token_symbol: Text;
        token_value: Nat;
    };

    public type CashFlowHistory = {
        fromId: Text;
        transactionAt: Int;
        amount: Float;
        transactionType: TransactionType;
        toId: ?Text;
    };

    public type JobTransaction = {
        id: Text;
        jobId: Text;
        clientId: Text;
        freelancerIds: [Text];
        status: Text; // e.g., "Open", "InProgress", "Completed"
        createdAt: Int;
    };

    public type Applier = {
        userId: Text;
        jobId: Text;
        appliedAt: Int;
    };

    public type Inbox = {
        id: Text;
        jobId: Text;
        senderId: Text;
        receiverId: Text;
        message: Text;
        inbox_type: Text;
        read: Bool;
        createdAt: Int;
    };

    public type Invitation = {
        id: Nat;
        jobId: Text;
        senderId: Text;
        freelancerId: Text;
        status: Text; // "pending", "accepted", "rejected"
        createdAt: Int;
    };
    
    public type Rating = {
        id: Nat;
        jobId: Text;
        userId: Text;
        rating: Nat;
        createdAt: Int;
    };

    public type HistoryRatingPayload = {
        rating: Nat;
        isEdit: Bool;
    };

    public type RequestRatingPayload = {
        userId: Text;
        rating: Nat;
        rating_id: Nat;
    };

    public type Submission = {
        id: Text;
        jobId: Text;
        userId: Text;
        submissionFilePath: Text;
        submissionMessage: Text;
        status: Text; // "Waiting", "Accept", "Reject"
        createdAt: Int;
    };

    // Chat Token System Types
    public type ChatTokenBalance = {
        availableTokens: Nat;
        dailyFreeRemaining: Nat;
        lastTokenReset: Int;
        totalTokensEarned: Nat;
        totalTokensSpent: Nat;
    };

    public type ChatTokenResponse = {
        success: Bool;
        message: Text;
        tokensUsed: Nat;
        tokensRemaining: Nat;
    };

    public type TokenBalanceResponse = {
        availableTokens: Nat;
        dailyFreeRemaining: Nat;
        dailyFreeLimit: Nat;
        lastTokenReset: Int;
    };

}