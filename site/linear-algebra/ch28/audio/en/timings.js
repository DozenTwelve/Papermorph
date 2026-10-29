window.TIMINGS = {
 "intro": {
  "dur": 13.8,
  "marks": {
   "sub": 3.646,
   "move": 6.172
  },
  "cues": [
   [
    0.104,
    "Chapter twenty-eight."
   ],
   [
    1.615,
    "Matrices with no inverse."
   ],
   [
    3.646,
    "Not every matrix can be undone."
   ],
   [
    6.172,
    "This chapter gives the test that tells them apart, and then undoes two matrices, one after the other."
   ]
  ]
 },
 "test": {
  "dur": 37.368,
  "marks": {
   "cols": 6.016,
   "go": 14.961,
   "x": 17.839,
   "ax": 21.081,
   "test": 29.505
  },
  "cues": [
   [
    0.091,
    "Take A equals one, three in the first row, and two, six in the second."
   ],
   [
    6.016,
    "Look at its columns: one, two, and three, six."
   ],
   [
    10.69,
    "The second is three times the first."
   ],
   [
    13.516,
    "Both lie on one line."
   ],
   [
    14.961,
    "So A squashes the whole plane onto that line."
   ],
   [
    17.839,
    "Now take x equals three, minus one."
   ],
   [
    21.081,
    "A x is three times column one, minus column two: three minus three, and six minus six."
   ],
   [
    28.229,
    "Zero, zero."
   ],
   [
    29.505,
    "Here is the test."
   ],
   [
    30.911,
    "If some x that is not zero has A x equal to zero, then A has no inverse."
   ]
  ]
 },
 "why": {
  "dur": 38.304,
  "marks": {
   "sup": 2.109,
   "mul": 4.206,
   "left": 9.609,
   "right": 13.659,
   "so": 20.495,
   "but": 22.383,
   "pic": 29.258
  },
  "cues": [
   [
    0.104,
    "Why does that rule out an inverse?"
   ],
   [
    2.109,
    "Suppose A inverse did exist."
   ],
   [
    4.206,
    "Start from A x equals zero, and multiply both sides by A inverse."
   ],
   [
    9.609,
    "On the left, A inverse times A x is just x."
   ],
   [
    13.659,
    "On the right, A inverse times zero is zero: any matrix times zero is zero."
   ],
   [
    20.495,
    "So x would have to be zero."
   ],
   [
    22.383,
    "But x is three, minus one, not zero."
   ],
   [
    26.016,
    "That's impossible, so there is no A inverse."
   ],
   [
    29.258,
    "In the picture: x and the origin both land on zero, zero."
   ],
   [
    34.18,
    "An inverse would have to send zero back to both of them at once."
   ]
  ]
 },
 "lost2": {
  "dur": 34.2,
  "marks": {
   "A": 1.484,
   "cols": 7.044,
   "x": 12.969,
   "ax": 15.417,
   "line": 22.044,
   "no": 31.901
  },
  "cues": [
   [
    0.091,
    "A second example."
   ],
   [
    1.484,
    "A is two, minus two in the first row, and minus one, one in the second."
   ],
   [
    7.044,
    "Column two is minus one times column one: again, both columns lie on one line."
   ],
   [
    12.969,
    "Try x equals one, one."
   ],
   [
    15.417,
    "Two minus two is zero, and minus one plus one is zero."
   ],
   [
    20.456,
    "A x is zero."
   ],
   [
    22.044,
    "And not only one, one."
   ],
   [
    23.659,
    "Two, two, and minus one, minus one: every point on this red line lands on zero."
   ],
   [
    30.247,
    "The whole line is lost."
   ],
   [
    31.901,
    "So this A has no inverse either."
   ]
  ]
 },
 "many": {
  "dur": 23.232,
  "marks": {
   "pt": 2.148,
   "slide": 6.797,
   "same": 11.745,
   "fold": 15.104
  },
  "cues": [
   [
    0.104,
    "Something stronger is true."
   ],
   [
    2.148,
    "Take any point, say one, zero."
   ],
   [
    4.492,
    "A sends it to two, minus one."
   ],
   [
    6.797,
    "Now slide it along the lost direction: to two, one, then three, two."
   ],
   [
    11.745,
    "They all land on the same point, two, minus one."
   ],
   [
    15.104,
    "A folds each of these lines onto a single point."
   ],
   [
    18.711,
    "Many points, one landing spot."
   ],
   [
    20.924,
    "No matrix can unfold that."
   ]
  ]
 },
 "missed": {
  "dur": 25.824,
  "marks": {
   "off": 1.693,
   "never": 4.792,
   "ch14": 12.227,
   "both": 19.036
  },
  "cues": [
   [
    0.104,
    "And there's a second problem."
   ],
   [
    1.693,
    "Take b equals one, one, off the line."
   ],
   [
    4.792,
    "No x lands there, because everything lands on the line."
   ],
   [
    8.372,
    "So A x equals one, one has no solution at all."
   ],
   [
    12.227,
    "That's the question from chapter fourteen: when the columns lie on one line, not every b can be reached."
   ],
   [
    19.036,
    "So a matrix with no inverse fails twice: some points collide, and some points are never reached."
   ]
  ]
 },
 "find": {
  "dur": 55.296,
  "marks": {
   "look": 1.81,
   "mix": 10.885,
   "x": 15.508,
   "chk": 18.529,
   "ex2": 27.148,
   "x2": 37.448,
   "chk2": 43.477,
   "any": 50.078
  },
  "cues": [
   [
    0.104,
    "How do you find such an x?"
   ],
   [
    1.81,
    "Compare the columns."
   ],
   [
    3.281,
    "In A equals two, four in the first row, and one, two in the second, column two is two times column one."
   ],
   [
    10.885,
    "So two of column one, minus one of column two, is zero."
   ],
   [
    15.508,
    "That's x equals two, minus one."
   ],
   [
    18.529,
    "Check by rows: two times two, minus four, is zero."
   ],
   [
    23.398,
    "And one times two, minus two, is zero."
   ],
   [
    27.148,
    "Another one: three, minus six in the first row, and one, minus two in the second."
   ],
   [
    33.893,
    "Column two is minus two times column one."
   ],
   [
    37.448,
    "So two of column one, plus one of column two, is zero."
   ],
   [
    41.55,
    "That's x equals two, one."
   ],
   [
    43.477,
    "Check: three times two, minus six, is zero, and two minus two is zero."
   ],
   [
    50.078,
    "And any multiple of x works too: the whole line through it is lost."
   ]
  ]
 },
 "q1": {
  "dur": 4.032,
  "marks": {},
  "cues": [
   [
    0.104,
    "Your turn."
   ],
   [
    1.042,
    "Drag a column tip so the whole plane goes flat."
   ]
  ]
 },
 "q2": {
  "dur": 5.28,
  "marks": {},
  "cues": [
   [
    0.091,
    "Quick check."
   ],
   [
    1.133,
    "Find a point, not zero, that A sends to zero."
   ]
  ]
 },
 "elim": {
  "dur": 36.144,
  "marks": {
   "A": 2.76,
   "step": 6.55,
   "zero": 9.401,
   "pivot": 12.695,
   "stuck": 16.432,
   "three": 22.565,
   "t2": 28.906,
   "t3": 33.177
  },
  "cues": [
   [
    0.104,
    "Elimination finds the same thing."
   ],
   [
    2.76,
    "Take one, three, two, six again, and write it next to I."
   ],
   [
    6.55,
    "Row two minus two times row one."
   ],
   [
    9.401,
    "The left half of row two becomes zero, zero."
   ],
   [
    12.695,
    "There is no second pivot, and no row below to swap in."
   ],
   [
    16.432,
    "The left half can never become I, so Gauss\u2013Jordan stops: no inverse."
   ],
   [
    22.565,
    "Three tests, one answer."
   ],
   [
    24.544,
    "a d minus b c is six minus six, zero."
   ],
   [
    28.906,
    "A x is zero for x equals three, minus one."
   ],
   [
    33.177,
    "And elimination finds a zero row."
   ]
  ]
 },
 "three": {
  "dur": 50.04,
  "marks": {
   "A": 2.539,
   "cols": 9.128,
   "x": 13.854,
   "ax": 19.427,
   "elim": 31.419,
   "elim2": 37.305,
   "no": 42.161
  },
  "cues": [
   [
    0.104,
    "The same happens in three by three."
   ],
   [
    2.539,
    "A is one, zero, one; two, one, three; and zero, one, one."
   ],
   [
    9.128,
    "Look closely: column three is column one plus column two."
   ],
   [
    13.854,
    "So x equals one, one, minus one gives A x equals zero."
   ],
   [
    19.427,
    "Row one: one plus zero minus one, zero."
   ],
   [
    23.385,
    "Row two: two plus one minus three, zero."
   ],
   [
    27.344,
    "Row three: zero plus one minus one, zero."
   ],
   [
    31.419,
    "Elimination agrees."
   ],
   [
    33.021,
    "Row two minus two times row one gives zero, one, one."
   ],
   [
    37.305,
    "Then row three minus row two gives zero, zero, zero."
   ],
   [
    42.161,
    "A zero row, only two pivots: no inverse."
   ],
   [
    45.977,
    "In space, this A squashes everything onto one plane."
   ]
  ]
 },
 "q3": {
  "dur": 3.12,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.133,
    "Which of these have an inverse?"
   ]
  ]
 },
 "prod": {
  "dur": 45.264,
  "marks": {
   "socks": 5.234,
   "off": 10.404,
   "B": 16.432,
   "A": 20.586,
   "undoA": 26.445,
   "undoB": 32.786,
   "rule": 36.589
  },
  "cues": [
   [
    0.104,
    "Now the other side: when A and B both have inverses, so does A times B."
   ],
   [
    5.234,
    "Think of socks and shoes."
   ],
   [
    7.279,
    "In the morning you put on your socks, then your shoes."
   ],
   [
    10.404,
    "In the evening you take off the shoes first, then the socks."
   ],
   [
    14.05,
    "The last thing on is the first thing off."
   ],
   [
    16.432,
    "Matrices work the same way."
   ],
   [
    18.555,
    "First, B shears the plane."
   ],
   [
    20.586,
    "Then A turns it."
   ],
   [
    21.693,
    "Together that's A B: B acts first, so it stands on the right."
   ],
   [
    26.445,
    "To undo, first undo the turn, with A inverse."
   ],
   [
    30.56,
    "The plane is back to just the shear."
   ],
   [
    32.786,
    "Then undo the shear, with B inverse."
   ],
   [
    35.807,
    "Home."
   ],
   [
    36.589,
    "So the inverse of A B is B inverse times A inverse."
   ],
   [
    40.768,
    "A inverse acts first, so it stands on the right."
   ],
   [
    44.18,
    "Reverse order."
   ]
  ]
 },
 "wrong": {
  "dur": 21.408,
  "marks": {
   "start": 2.383,
   "ub": 4.271,
   "ua": 7.474,
   "look": 10.508
  },
  "cues": [
   [
    0.104,
    "What if we undo them in the wrong order?"
   ],
   [
    2.383,
    "Start again from A B."
   ],
   [
    4.271,
    "Undo the shear first, with B inverse."
   ],
   [
    7.474,
    "Then undo the turn, with A inverse."
   ],
   [
    10.508,
    "The plane is not home."
   ],
   [
    11.927,
    "The flag is somewhere else."
   ],
   [
    13.62,
    "A inverse times B inverse is not the inverse of A B."
   ],
   [
    17.539,
    "Order matters, just as A B and B A are different."
   ]
  ]
 },
 "alg": {
  "dur": 40.248,
  "marks": {
   "mul": 1.497,
   "inner": 5.521,
   "gone": 8.177,
   "last": 9.57,
   "nums": 11.654,
   "e1": 21.875,
   "e2": 27.174,
   "e3": 30.052,
   "e4": 34.935,
   "I": 37.63
  },
  "cues": [
   [
    0.104,
    "Check it with algebra."
   ],
   [
    1.497,
    "Multiply A B by B inverse A inverse."
   ],
   [
    5.521,
    "In the middle, B times B inverse is I."
   ],
   [
    8.177,
    "A times I is A, and A times A inverse is I."
   ],
   [
    11.654,
    "And with numbers."
   ],
   [
    12.982,
    "A B is zero, minus one, one, one."
   ],
   [
    16.68,
    "B inverse A inverse is one, one, minus one, zero."
   ],
   [
    21.875,
    "Row zero, minus one, times column one, minus one: one."
   ],
   [
    27.174,
    "Times column one, zero: zero."
   ],
   [
    30.052,
    "Row one, one, times column one, minus one: zero."
   ],
   [
    34.935,
    "And times one, zero: one."
   ],
   [
    37.63,
    "The identity."
   ],
   [
    38.711,
    "Reverse order works."
   ]
  ]
 },
 "q4": {
  "dur": 3.024,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.198,
    "Find the inverse of a product."
   ]
  ]
 },
 "wrap": {
  "dur": 31.752,
  "marks": {
   "w1": 1.016,
   "w2": 6.693,
   "w3": 13.294,
   "w4": 20.898,
   "end": 29.557
  },
  "cues": [
   [
    0.104,
    "To sum up."
   ],
   [
    1.016,
    "A has no inverse when some x, not zero, has A x equal to zero."
   ],
   [
    6.693,
    "Then the columns lie on one line, or in one plane: the grid goes flat, and points collide."
   ],
   [
    13.294,
    "Elimination shows it as a zero row."
   ],
   [
    16.654,
    "For two by two, a d minus b c is zero."
   ],
   [
    20.898,
    "When A and B have inverses, the inverse of A B is B inverse times A inverse: reverse order, like socks and shoes."
   ],
   [
    29.557,
    "Now try the chapter practice."
   ]
  ]
 },
 "final1": {
  "dur": 3.528,
  "marks": {},
  "cues": [
   [
    0.104,
    "Chapter practice."
   ],
   [
    1.55,
    "Which matrices have an inverse?"
   ]
  ]
 },
 "final2": {
  "dur": 2.424,
  "marks": {},
  "cues": [
   [
    0.104,
    "Next, find the lost direction."
   ]
  ]
 },
 "final3": {
  "dur": 1.968,
  "marks": {},
  "cues": [
   [
    0.091,
    "Now, inverses of products."
   ]
  ]
 },
 "final4": {
  "dur": 2.472,
  "marks": {},
  "cues": [
   [
    0.104,
    "Last set."
   ],
   [
    1.224,
    "Use your hands."
   ]
  ]
 },
 "play": {
  "dur": 13.32,
  "marks": {
   "go": 4.18
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
    4.18,
    "Change A, and watch its inverse."
   ],
   [
    6.641,
    "Make the plane flat, then drag x onto the red line, and watch A x."
   ],
   [
    11.667,
    "Press continue when you're done."
   ]
  ]
 },
 "finish": {
  "dur": 10.512,
  "marks": {},
  "cues": [
   [
    0.091,
    "Well done."
   ],
   [
    1.094,
    "That's the end of chapter twenty-eight, matrices with no inverse, and the end of Unit three."
   ],
   [
    7.422,
    "Next: factoring A into L times U."
   ]
  ]
 }
};
