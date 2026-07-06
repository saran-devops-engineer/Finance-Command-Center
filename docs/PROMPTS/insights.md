# Insights Prompt

Use this prompt when improving Insights.

## Screen Question

What should I do next?

## Goals

- Provide clear, explainable recommendations.
- Prioritize the most useful action.
- Explain why an action matters.
- Keep recommendations deterministic in V1.

## Rules

- Do not call external AI APIs in V1.
- Do not imply real AI if logic is rule-based.
- Keep recommendations conservative.
- Put reusable decision logic in services.

## Good Improvements

- Recommendation ranking.
- Better "why this matters" copy.
- Links to relevant loan or money screens.
- Estimated impact with assumptions.
- Weekly review summary.

## Avoid

- Vague advice.
- Overconfident financial claims.
- Too many simultaneous recommendations.
