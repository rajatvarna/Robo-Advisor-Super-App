
export const questionnaire = [
  {
    key: 'age',
    question: 'What is your age range?',
    options: ['Under 25', '25-34', '35-44', '45-54', '55-64', '65+'],
  },
  {
    key: 'horizon',
    question: 'What is your investment horizon?',
    options: ['Less than 3 years', '3-5 years', '6-10 years', 'More than 10 years'],
  },
  {
    key: 'goal',
    question: 'What is your primary investment goal?',
    options: ['Capital preservation', 'Income generation', 'Balanced growth', 'Aggressive growth'],
  },
  {
    key: 'riskTolerance',
    question: 'How would you react to a 20% drop in your portfolio value in a short period?',
    options: [
      'Sell all of my investments',
      'Sell some of my investments',
      'Hold and do nothing',
      'Buy more investments',
    ],
  },
  {
    key: 'liquidity',
    question: 'How much of your portfolio do you need to be able to access as cash within a week?',
    options: ['Less than 10%', '10-25%', '25-50%', 'More than 50%'],
  },
];
