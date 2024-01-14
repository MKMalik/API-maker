const jwt = require('jsonwebtoken');

const verifyTokenWithRules = async (req, res, next) => {
    // check if rules are defined and enabled
    const endpoint = req.endpoint;
    const authHeader = req.headers.authorization;
    let jwtToken;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Extract token excluding 'Bearer '
        jwtToken = token;
    }

    if (endpoint.rules && endpoint.rules.length > 0) {
        if (!jwtToken) {
            return res.status(401).json({ message: 'Unauthorized: Missing token' });
        }

        // Then use the async function to verify the token
        try {
            const decodedToken = await verifyToken(jwtToken, endpoint.jwtSecret);

            // Perform dynamic rule-based checks
            const validationResults = evaluateTokenRules(decodedToken, req, endpoint?.rules);

            if (Array.isArray(validationResults) && validationResults.length > 0) {
                // Permission denied based on rule conditions
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions', failedRules: validationResults });
            } else {
                req.decodedToken = decodedToken;
                next(); // Proceed to the nestedInsert endpoint logic
            }
        } catch (error) {
            // console.error('Token verification or rule evaluation error:', error);
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

    }
    else {
        next();
    }
};
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

async function verifyToken(jwtToken, jwtSecret) {
    return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, jwtSecret, (err, decodedToken) => {
            if (err) {
                // console.error('JWT verification error:', err);
                reject(err);
            } else {
                resolve(decodedToken);
            }
        });
    });
}



module.exports = { verifyTokenWithRules }