"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class NewsFilterRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['ignore_on_news', 'sentiment_threshold']);
        const { ignore_on_news, sentiment_threshold } = this.config.params;
        const ms = context.marketState || {};
        const news = ms.recentNews || [];
        if (!news || news.length === 0)
            return this.createResult(false, 0, 'No recent news');
        const worst = Math.min(...news.map((n) => n.sentiment || 0));
        if (ignore_on_news && worst < sentiment_threshold) {
            return this.createResult(false, 0, 'News filter blocked due to negative news');
        }
        return this.createResult(false, 0, 'News acceptable');
    }
}
exports.default = NewsFilterRule;
