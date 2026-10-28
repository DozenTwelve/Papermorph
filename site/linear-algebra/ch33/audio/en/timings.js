window.TIMINGS = {
 "intro": {
  "dur": 12.144,
  "marks": {
   "sub": 4.05,
   "move": 6.458
  },
  "cues": [
   [
    0.104,
    "Chapter thirty-three."
   ],
   [
    1.68,
    "How much work is elimination?"
   ],
   [
    4.05,
    "We count every operation it takes."
   ],
   [
    6.458,
    "For an n by n matrix the count grows like n cubed, divided by three."
   ]
  ]
 },
 "one": {
  "dur": 41.736,
  "marks": {
   "A": 3.945,
   "l": 10.859,
   "seven": 19.974,
   "total": 29.818,
   "rule": 33.268,
   "chart": 39.206
  },
  "cues": [
   [
    0.104,
    "Before we count, we decide what one operation is."
   ],
   [
    3.945,
    "Take chapter thirty's matrix: two, one, eight, seven."
   ],
   [
    8.555,
    "Elimination changes row two."
   ],
   [
    10.859,
    "First the eight."
   ],
   [
    11.901,
    "We find the multiplier: eight divided by the pivot two is four, and the eight becomes zero."
   ],
   [
    18.255,
    "That costs one division."
   ],
   [
    19.974,
    "Then the seven: seven minus four times one is three."
   ],
   [
    23.88,
    "That's one multiplication and one subtraction."
   ],
   [
    27.174,
    "We count the pair as one operation."
   ],
   [
    29.818,
    "Two numbers of row two changed, so the count is two."
   ],
   [
    33.268,
    "So the rule is simple: every number below a pivot that changes costs one operation."
   ],
   [
    39.206,
    "On the right, the chart keeps the score."
   ]
  ]
 },
 "three": {
  "dur": 51.504,
  "marks": {
   "A": 1.979,
   "s1": 4.557,
   "go1": 9.74,
   "row3": 17.656,
   "six": 25.495,
   "s2": 29.049,
   "go2": 34.648,
   "two": 38.997,
   "tot": 42.292,
   "corner": 45.938
  },
  "cues": [
   [
    0.104,
    "Now three by three."
   ],
   [
    1.979,
    "Here's a matrix with three rows."
   ],
   [
    4.557,
    "The first pivot is two."
   ],
   [
    6.367,
    "Below it are two rows, with three numbers each."
   ],
   [
    9.74,
    "Row two: four becomes zero, three minus two times one is one, three minus two times one is one."
   ],
   [
    17.656,
    "Row three: eight becomes zero, seven minus four times one is three, nine minus four times one is five."
   ],
   [
    25.495,
    "Two rows times three numbers: six operations."
   ],
   [
    29.049,
    "Now the pivot is the one in the middle."
   ],
   [
    31.641,
    "Below it is one row, with two numbers."
   ],
   [
    34.648,
    "Three becomes zero, and five minus three times one is two."
   ],
   [
    38.997,
    "One row times two numbers: two operations."
   ],
   [
    42.292,
    "Six plus two: eight operations for three by three."
   ],
   [
    45.938,
    "Each step works on a smaller corner: three by three first, then two by two."
   ]
  ]
 },
 "four": {
  "dur": 34.824,
  "marks": {
   "s1": 2.839,
   "s2": 8.242,
   "s3": 12.109,
   "tot": 15.404,
   "pat": 19.128,
   "sum": 26.406
  },
  "cues": [
   [
    0.143,
    "Four by four, without the numbers."
   ],
   [
    2.839,
    "Below the first pivot: three rows of four numbers."
   ],
   [
    6.68,
    "Twelve operations."
   ],
   [
    8.242,
    "Below the second: two rows of three."
   ],
   [
    11.12,
    "Six."
   ],
   [
    12.109,
    "Below the third: one row of two."
   ],
   [
    14.701,
    "Two."
   ],
   [
    15.404,
    "Twelve, plus six, plus two: twenty."
   ],
   [
    19.128,
    "See the pattern?"
   ],
   [
    20.182,
    "A corner k by k costs k minus one, times k."
   ],
   [
    24.674,
    "That's almost k squared."
   ],
   [
    26.406,
    "For a big matrix, the whole count is close to n squared, plus n minus one squared, and so on, down to one squared."
   ]
  ]
 },
 "q1": {
  "dur": 5.4,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.107,
    "Count the operations for a five by five matrix, step by step."
   ]
  ]
 },
 "chart": {
  "dur": 39.984,
  "marks": {
   "n2": 1.94,
   "n3": 4.479,
   "n4": 6.81,
   "n5": 8.88,
   "grow": 10.925,
   "curve": 14.232,
   "close": 17.422,
   "ratio": 19.57,
   "exact": 29.036
  },
  "cues": [
   [
    0.104,
    "Let's put the counts on a chart."
   ],
   [
    1.94,
    "Two by two: two operations."
   ],
   [
    4.479,
    "Three by three: eight."
   ],
   [
    6.81,
    "Four by four: twenty."
   ],
   [
    8.88,
    "Five by five: forty."
   ],
   [
    10.925,
    "Keep going, up to ten by ten: three hundred thirty."
   ],
   [
    14.232,
    "The dashed curve is n cubed over three."
   ],
   [
    17.422,
    "The bars stay just under it."
   ],
   [
    19.57,
    "Divide the count by n cubed over three: for ten, that's zero point nine nine."
   ],
   [
    25.82,
    "The bigger n is, the closer it gets to one."
   ],
   [
    29.036,
    "The exact count is n cubed minus n, over three."
   ],
   [
    33.411,
    "For ten: a thousand minus ten is nine hundred ninety, and a third of that is three hundred thirty."
   ]
  ]
 },
 "pyr": {
  "dur": 41.712,
  "marks": {
   "stack": 1.172,
   "l1": 5.495,
   "l2": 11.628,
   "all": 15.469,
   "box": 19.01,
   "cone": 23.307,
   "third": 28.62,
   "steps": 36.432
  },
  "cues": [
   [
    0.104,
    "Why a third?"
   ],
   [
    1.172,
    "Stack the steps on top of the matrix, one layer for each step."
   ],
   [
    5.495,
    "The first layer covers the corner the first step works on."
   ],
   [
    9.102,
    "Each square on it is one operation."
   ],
   [
    11.628,
    "The second layer sits on top, one smaller each way."
   ],
   [
    15.469,
    "Then the third, and so on, up to the last little step."
   ],
   [
    19.01,
    "The layers build a staircase inside a box, n by n by n."
   ],
   [
    23.307,
    "The staircase hugs a pyramid, with a base n by n and a height of n."
   ],
   [
    28.62,
    "A pyramid holds one third of its box: base times height, divided by three."
   ],
   [
    34.206,
    "That's n cubed over three."
   ],
   [
    36.432,
    "The steps leave out a sliver along the edges: that's the minus n over three."
   ]
  ]
 },
 "q2": {
  "dur": 8.16,
  "marks": {},
  "cues": [
   [
    0.104,
    "Your turn."
   ],
   [
    1.055,
    "Change n until elimination needs more than a thousand operations, with n as small as it can be."
   ]
  ]
 },
 "double": {
  "dur": 28.8,
  "marks": {
   "ten": 3.151,
   "twenty": 6.458,
   "eight": 9.922,
   "big": 16.68,
   "huge": 24.518
  },
  "cues": [
   [
    0.104,
    "What happens when the matrix gets twice as big?"
   ],
   [
    3.151,
    "Ten by ten: three hundred thirty operations."
   ],
   [
    6.458,
    "Twenty by twenty: two thousand six hundred sixty."
   ],
   [
    9.922,
    "That's eight times as many, because two cubed is eight."
   ],
   [
    13.724,
    "Twice the size, eight times the work."
   ],
   [
    16.68,
    "A thousand by a thousand takes about three hundred thirty-three million operations."
   ],
   [
    21.589,
    "A computer does that in well under a second."
   ],
   [
    24.518,
    "But a million by a million would keep a fast computer busy for days."
   ]
  ]
 },
 "right": {
  "dur": 44.112,
  "marks": {
   "b": 1.68,
   "f1": 6.836,
   "f2": 10.378,
   "back": 11.693,
   "r3": 14.349,
   "r2": 16.354,
   "r1": 20.169,
   "nine": 23.021,
   "cheap": 30.378,
   "lu": 36.745
  },
  "cues": [
   [
    0.104,
    "And the right side, b?"
   ],
   [
    1.68,
    "Each step changes just one number of b in every row below the pivot."
   ],
   [
    6.836,
    "For three by three: two numbers in the first step, one in the second."
   ],
   [
    11.693,
    "Then back substitution, from the bottom up."
   ],
   [
    14.349,
    "Row three: one division."
   ],
   [
    16.354,
    "Row two: one multiply-subtract, and a division."
   ],
   [
    20.169,
    "Row one: two, and a division."
   ],
   [
    23.021,
    "Three plus six: nine operations, three squared."
   ],
   [
    27.253,
    "For any n, b costs n squared."
   ],
   [
    30.378,
    "So a new right side is cheap: n squared, against n cubed over three for A."
   ],
   [
    36.745,
    "That's why we keep L and U."
   ],
   [
    38.32,
    "We factor A once, the expensive part, and then every new b costs only n squared."
   ]
  ]
 },
 "q3": {
  "dur": 3.528,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.133,
    "Count for a six by six matrix."
   ]
  ]
 },
 "wrap": {
  "dur": 38.088,
  "marks": {
   "w1": 1.003,
   "w2": 10.339,
   "w3": 21.029,
   "w4": 29.74,
   "end": 35.925
  },
  "cues": [
   [
    0.104,
    "Let's sum up."
   ],
   [
    1.003,
    "One operation is one number below a pivot changing: a multiplication and a subtraction, or the division that finds the multiplier."
   ],
   [
    10.339,
    "A step on a k by k corner costs k minus one, times k."
   ],
   [
    15.378,
    "For n by n, the steps add up to n cubed minus n, over three."
   ],
   [
    21.029,
    "That's about n cubed over three, a third of an n by n by n box."
   ],
   [
    26.445,
    "Twice the size means eight times the work."
   ],
   [
    29.74,
    "The right side b costs only n squared, so we factor A once and keep L and U."
   ],
   [
    35.925,
    "Now try the chapter practice."
   ]
  ]
 },
 "final1": {
  "dur": 4.08,
  "marks": {},
  "cues": [
   [
    0.104,
    "Chapter practice."
   ],
   [
    1.51,
    "Count the operations of one step."
   ]
  ]
 },
 "final2": {
  "dur": 3.192,
  "marks": {},
  "cues": [
   [
    0.104,
    "Set two."
   ],
   [
    1.068,
    "Count the whole elimination."
   ]
  ]
 },
 "final3": {
  "dur": 3.456,
  "marks": {},
  "cues": [
   [
    0.104,
    "Set three."
   ],
   [
    1.185,
    "Estimate, and compare A with b."
   ]
  ]
 },
 "final4": {
  "dur": 4.68,
  "marks": {},
  "cues": [
   [
    0.104,
    "Last set."
   ],
   [
    1.289,
    "Change n with your own hands until the count is right."
   ]
  ]
 },
 "play": {
  "dur": 11.352,
  "marks": {
   "go": 4.245
  },
  "cues": [
   [
    0.104,
    "Playground."
   ],
   [
    1.094,
    "Nothing here is marked right or wrong."
   ],
   [
    4.245,
    "Change n, from two up to sixty, and watch the steps, the staircase and the chart grow together."
   ]
  ]
 },
 "finish": {
  "dur": 13.272,
  "marks": {},
  "cues": [
   [
    0.104,
    "Well done."
   ],
   [
    1.094,
    "That's the end of chapter thirty-three, How Much Work Is Elimination?"
   ],
   [
    5.964,
    "Next: chapter thirty-four, where a row exchange joins the factors, and P A equals L U."
   ]
  ]
 }
};
