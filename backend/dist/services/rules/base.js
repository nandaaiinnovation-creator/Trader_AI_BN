"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRule = exports.RuleErrorType = void 0;
var RuleErrorType;
(function (RuleErrorType) {
    RuleErrorType["CONFIG_MISSING"] = "CONFIG_MISSING";
    RuleErrorType["DATA_MISSING"] = "DATA_MISSING";
    RuleErrorType["RULE_ERROR"] = "RULE_ERROR";
})(RuleErrorType || (exports.RuleErrorType = RuleErrorType = {}));
class BaseRule {
    constructor(config) {
        this.config = config;
    }
    validateConfig(required) {
        for (const param of required) {
            if (this.config.params[param] === undefined) {
                const err = new Error(`Missing required parameter: ${param}`);
                err.type = RuleErrorType.CONFIG_MISSING;
                throw err;
            }
        }
    }
    createResult(pass, score, reason) {
        return { pass, score, reason };
    }
}
exports.BaseRule = BaseRule;
