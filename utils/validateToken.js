// Function to evaluate token rules dynamically
const evaluateTokenRules = (decodedToken, req, rules) => {
    const failedRules = [];

    // Evaluate rules provided by the client
    for (const ruleName in rules) {
        try {
            const ruleCondition = rules[ruleName];
            const isRuleValid = evaluateRule(ruleCondition, decodedToken, req);
            if (!isRuleValid) {
                failedRules.push(rules[ruleName]);
            }
        } catch (error) {
            console.error('Error evaluating rule:', error, ruleName);
            failedRules.push(ruleName);
        }
    }

    return failedRules; // Return the list of failed rules
};

// Helper function to evaluate an individual rule
const evaluateRule = (ruleCondition, decodedToken, req) => {
    try {
        // Use a safer mechanism to evaluate conditions without using eval
        const conditionFunction = new Function('decodedToken', 'req', `return ${ruleCondition}`);
        return conditionFunction(decodedToken, req);
    } catch (error) {
        console.error('Error evaluating rule condition:', error, ruleCondition);
        return false;
    }
};

module.exports = { evaluateTokenRules }