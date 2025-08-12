class RuleFlowException extends Error {
    constructor(message) {
        super(message);
        this.name = 'RuleFlowException';
    }
}