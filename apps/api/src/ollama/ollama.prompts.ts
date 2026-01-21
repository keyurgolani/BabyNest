/**
 * Ollama Prompt Templates for Baby Tracking Analysis
 * 
 * These prompts are designed for local AI processing with Ollama
 * to analyze baby tracking data and provide insights.
 * 
 * Requirements: 10.4 - Local AI processing with Ollama
 */

/**
 * System prompt for baby tracking analysis
 * Sets the context and behavior for the AI assistant
 */
export const BABY_TRACKING_SYSTEM_PROMPT = `You are a helpful baby care assistant that analyzes tracking data to provide insights for parents and caregivers. You have expertise in infant development, sleep patterns, feeding schedules, and general baby care.

Your role is to:
1. Analyze patterns in baby tracking data (sleep, feeding, diapers, growth)
2. Provide actionable insights and recommendations
3. Identify potential concerns that may warrant discussion with a pediatrician
4. Offer encouragement and support to caregivers

Guidelines:
- Be concise and practical in your responses
- Focus on patterns and trends rather than individual data points
- Always recommend consulting a pediatrician for medical concerns
- Use age-appropriate recommendations based on the baby's age
- Be supportive and non-judgmental in your tone
- Provide specific, actionable suggestions when possible`;

/**
 * Prompt template for sleep pattern analysis
 * Used for predicting optimal nap times and analyzing sleep quality
 */
export const SLEEP_ANALYSIS_PROMPT = `Analyze the following sleep data for a baby and provide insights:

Baby Age: {{babyAgeMonths}} months
Recent Sleep Data (last 7 days):
{{sleepData}}

Please provide:
1. Analysis of sleep patterns (total sleep, nap frequency, night sleep quality)
2. Current wake window assessment
3. Predicted optimal next nap time based on patterns
4. Any concerns or recommendations for improving sleep

Keep your response concise and actionable.`;

/**
 * Prompt template for feeding pattern analysis
 * Used for identifying feeding schedules and nutrition insights
 */
export const FEEDING_ANALYSIS_PROMPT = `Analyze the following feeding data for a baby and provide insights:

Baby Age: {{babyAgeMonths}} months
Recent Feeding Data (last 7 days):
{{feedingData}}

Please provide:
1. Analysis of feeding patterns (frequency, amounts, timing)
2. Assessment of feeding consistency
3. Suggested feeding schedule based on patterns
4. Any concerns or recommendations

Keep your response concise and actionable.`;

/**
 * Prompt template for weekly summary generation
 * Aggregates all tracking data into a comprehensive summary
 */
export const WEEKLY_SUMMARY_PROMPT = `Generate a weekly summary for the following baby tracking data:

Baby Name: {{babyName}}
Baby Age: {{babyAgeMonths}} months
Week: {{weekStart}} to {{weekEnd}}

Sleep Summary:
{{sleepSummary}}

Feeding Summary:
{{feedingSummary}}

Diaper Summary:
{{diaperSummary}}

Growth Data:
{{growthData}}

Activities:
{{activitiesSummary}}

Please provide:
1. Overall assessment of the week
2. Key patterns and trends observed
3. Positive highlights to celebrate
4. Areas that may need attention
5. Recommendations for the coming week

Keep your response supportive and actionable.`;

/**
 * Prompt template for anomaly detection
 * Identifies unusual patterns that may need attention
 */
export const ANOMALY_DETECTION_PROMPT = `Review the following baby tracking data and identify any anomalies or concerns:

Baby Age: {{babyAgeMonths}} months
Recent Data (last 48 hours):

Sleep:
{{sleepData}}

Feeding:
{{feedingData}}

Diapers:
{{diaperData}}

Please identify:
1. Any significant deviations from normal patterns
2. Potential concerns that warrant monitoring
3. Issues that may need pediatrician consultation
4. Recommendations for addressing any concerns

Be specific about what patterns are unusual and why they may be concerning.`;

/**
 * Prompt template for growth assessment
 * Analyzes growth measurements against developmental expectations
 */
export const GROWTH_ASSESSMENT_PROMPT = `Analyze the following growth data for a baby:

Baby Age: {{babyAgeMonths}} months
Gender: {{gender}}

Recent Growth Measurements:
{{growthData}}

WHO Percentiles:
- Weight: {{weightPercentile}}th percentile
- Height: {{heightPercentile}}th percentile
- Head Circumference: {{headPercentile}}th percentile

Please provide:
1. Assessment of growth trajectory
2. Comparison to typical growth patterns for this age
3. Any concerns about growth velocity
4. Recommendations if applicable

Keep your response informative but reassuring.`;

/**
 * Prompt template for milestone guidance
 * Provides age-appropriate milestone information
 */
export const MILESTONE_GUIDANCE_PROMPT = `Provide milestone guidance for a baby:

Baby Age: {{babyAgeMonths}} months
Recently Achieved Milestones:
{{achievedMilestones}}

Upcoming Expected Milestones:
{{upcomingMilestones}}

Please provide:
1. Celebration of recent achievements
2. What to expect in the coming weeks
3. Activities to encourage development
4. When to discuss concerns with a pediatrician

Keep your response encouraging and practical.`;

/**
 * Helper function to fill in prompt templates
 * @param template The prompt template with {{placeholders}}
 * @param variables Object with variable values to substitute
 * @returns The filled prompt string
 */
export function fillPromptTemplate(
  template: string,
  variables: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }
  return result;
}

/**
 * Prompt types for type-safe prompt selection
 */
export type PromptType =
  | 'sleep_analysis'
  | 'feeding_analysis'
  | 'weekly_summary'
  | 'anomaly_detection'
  | 'growth_assessment'
  | 'milestone_guidance'
  | 'daily_trend'
  | 'weekly_trend'
  | 'monthly_trend'
  | 'yearly_trend';

/**
 * Get the appropriate prompt template by type
 */
export function getPromptTemplate(type: PromptType): string {
  const templates: Record<PromptType, string> = {
    sleep_analysis: SLEEP_ANALYSIS_PROMPT,
    feeding_analysis: FEEDING_ANALYSIS_PROMPT,
    weekly_summary: WEEKLY_SUMMARY_PROMPT,
    anomaly_detection: ANOMALY_DETECTION_PROMPT,
    growth_assessment: GROWTH_ASSESSMENT_PROMPT,
    milestone_guidance: MILESTONE_GUIDANCE_PROMPT,
    daily_trend: DAILY_TREND_PROMPT,
    weekly_trend: WEEKLY_TREND_PROMPT,
    monthly_trend: MONTHLY_TREND_PROMPT,
    yearly_trend: YEARLY_TREND_PROMPT,
  };
  return templates[type];
}


/**
 * Prompt template for daily trend insights
 * Analyzes patterns from a single day's data
 */
export const DAILY_TREND_PROMPT = `Analyze the following daily tracking data for a baby and provide a brief summary:

Baby Name: {{babyName}}
Baby Age: {{babyAgeMonths}} months
Baby Gender: {{babyGender}}
Date: {{periodStart}}

Sleep Data:
{{sleepSummary}}

Feeding Data:
{{feedingSummary}}

Diaper Data:
{{diaperSummary}}

Activities:
{{activitySummary}}

IMPORTANT CONSTRAINTS:
- Keep your response to 2-3 sentences maximum (under 50 words)
- Be direct and specific - no filler words
- Focus on the most important observation or actionable insight
- Write in a warm, supportive tone for tired parents
- Use the correct pronouns (he/him for male, she/her for female) based on the baby's gender
- Do NOT use bullet points, numbered lists, or markdown formatting
- Do NOT include greetings or sign-offs

Example good response: "Emma had a solid day with 12 hours of sleep across 3 naps. Feeding was consistent at 6 sessions. Consider slightly longer wake windows as she seems ready for the next sleep transition."`;

/**
 * Prompt template for weekly trend insights
 * Analyzes patterns and trends over a week
 */
export const WEEKLY_TREND_PROMPT = `Analyze the following weekly tracking data for a baby and provide trend insights:

Baby Name: {{babyName}}
Baby Age: {{babyAgeMonths}} months
Baby Gender: {{babyGender}}
Week: {{periodStart}} to {{periodEnd}} ({{periodDays}} days)

Sleep Summary:
{{sleepSummary}}

Feeding Summary:
{{feedingSummary}}

Diaper Summary:
{{diaperSummary}}

Growth Data:
{{growthSummary}}

Activities Summary:
{{activitySummary}}

Comparison to Previous Week:
{{previousPeriodComparison}}

Please provide:
1. Overall assessment of the week's patterns
2. Key trends observed (improving, declining, or stable)
3. Sleep pattern analysis and wake window assessment
4. Feeding pattern consistency and any concerns
5. Developmental observations based on activities
6. Top 3 highlights to celebrate
7. Top 2 areas that may need attention
8. Specific recommendations for the coming week

Be supportive, data-driven, and provide actionable insights.`;

/**
 * Prompt template for monthly trend insights
 * Analyzes patterns and developmental progress over a month
 */
export const MONTHLY_TREND_PROMPT = `Analyze the following monthly tracking data for a baby and provide comprehensive trend insights:

Baby Name: {{babyName}}
Baby Age: {{babyAgeMonths}} months
Month: {{periodStart}} to {{periodEnd}} ({{periodDays}} days)

Sleep Summary:
{{sleepSummary}}

Feeding Summary:
{{feedingSummary}}

Diaper Summary:
{{diaperSummary}}

Growth Data:
{{growthSummary}}

Activities Summary:
{{activitySummary}}

Comparison to Previous Month:
{{previousPeriodComparison}}

Please provide:
1. Monthly overview and developmental assessment
2. Sleep pattern evolution and quality trends
3. Feeding pattern changes and nutritional observations
4. Growth trajectory analysis (if data available)
5. Activity and developmental milestone progress
6. Consistency analysis across all tracking categories
7. Month-over-month improvements
8. Areas showing decline or needing attention
9. Age-appropriate recommendations for the coming month
10. When to consider consulting a pediatrician (if applicable)

Provide a comprehensive but digestible summary suitable for sharing with family or healthcare providers.`;

/**
 * Prompt template for yearly trend insights
 * Analyzes long-term patterns and developmental milestones over a year
 */
export const YEARLY_TREND_PROMPT = `Analyze the following yearly tracking data for a baby and provide comprehensive developmental insights:

Baby Name: {{babyName}}
Baby Age: {{babyAgeMonths}} months (started tracking at approximately {{startAgeMonths}} months)
Year: {{periodStart}} to {{periodEnd}} ({{periodDays}} days)

Sleep Summary:
{{sleepSummary}}

Feeding Summary:
{{feedingSummary}}

Diaper Summary:
{{diaperSummary}}

Growth Data:
{{growthSummary}}

Activities Summary:
{{activitySummary}}

Please provide:
1. Year in review: Overall developmental journey
2. Sleep evolution: How sleep patterns have matured
3. Feeding journey: Transition from newborn feeding to current stage
4. Growth milestones: Weight, height, and percentile trends
5. Activity and developmental achievements
6. Key milestones reached during this period
7. Patterns that have improved significantly
8. Areas of consistent strength
9. Recommendations for the coming year based on developmental stage
10. Suggested topics to discuss at next pediatrician visit

Create a comprehensive annual summary that celebrates the baby's growth journey and provides forward-looking guidance.`;
