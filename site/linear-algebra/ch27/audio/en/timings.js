window.TIMINGS = {
 "intro": {
  "dur": 16.896,
  "marks": {
   "sub": 4.453,
   "move": 9.792
  },
  "cues": [
   [
    0.104,
    "Chapter twenty-seven."
   ],
   [
    1.875,
    "Finding the inverse: Gauss\u2013Jordan."
   ],
   [
    4.453,
    "The formula from chapter twenty-six only works for two by two matrices."
   ],
   [
    9.792,
    "Here's a method that works for any size: the elimination you already know, run on two sides at once."
   ]
  ]
 },
 "cols": {
  "dur": 49.008,
  "marks": {
   "A": 2.266,
   "want": 7.604,
   "split": 11.12,
   "s2": 18.333,
   "two": 22.096,
   "pic": 30.859,
   "x1": 35.273,
   "x2": 37.161,
   "read": 42.096
  },
  "cues": [
   [
    0.104,
    "Take the matrix from the lecture."
   ],
   [
    2.266,
    "A is one, three in the first row, and two, seven in the second."
   ],
   [
    7.604,
    "We want A inverse, so that A times A inverse is I."
   ],
   [
    11.12,
    "Look at it one column at a time."
   ],
   [
    13.008,
    "A times the first column of A inverse must give the first column of I: one, zero."
   ],
   [
    18.333,
    "And A times the second column must give zero, one."
   ],
   [
    22.096,
    "So these are two systems, A x equals b: one with b equal to one, zero, and one with b equal to zero, one."
   ],
   [
    30.859,
    "In the picture: which point does A send to one, zero?"
   ],
   [
    35.273,
    "It's seven, minus two."
   ],
   [
    37.161,
    "And the point that A sends to zero, one is minus three, one."
   ],
   [
    42.096,
    "Those two points are the columns of A inverse."
   ],
   [
    45.195,
    "Now let's find them by elimination, instead of by searching."
   ]
  ]
 },
 "table": {
  "dur": 29.088,
  "marks": {
   "A": 2.734,
   "bar": 3.516,
   "I": 4.557,
   "aug": 12.917,
   "goal": 17.318,
   "grid": 22.344
  },
  "cues": [
   [
    0.104,
    "Elimination works on the numbers only."
   ],
   [
    2.734,
    "Write A, draw a line, and write both right sides next to it: one, zero, and zero, one."
   ],
   [
    9.544,
    "Side by side, they make the identity matrix."
   ],
   [
    12.917,
    "This is A next to I: two right-hand sides at once instead of one."
   ],
   [
    17.318,
    "The goal: turn the left half into I."
   ],
   [
    20.052,
    "Then the right half will be A inverse."
   ],
   [
    22.344,
    "Watch the plane on the right, too."
   ],
   [
    24.128,
    "It is moved by the left half."
   ],
   [
    26.029,
    "When the left half is I, the plane is home."
   ]
  ]
 },
 "down": {
  "dur": 34.344,
  "marks": {
   "piv": 2.93,
   "mult": 4.622,
   "op": 9.323,
   "go": 12.214,
   "right": 20.703,
   "plane": 27.096
  },
  "cues": [
   [
    0.091,
    "Step one is the elimination you know."
   ],
   [
    2.93,
    "The first pivot is one."
   ],
   [
    4.622,
    "Below it is a two, so the multiplier is two over one: two."
   ],
   [
    9.323,
    "Row two minus two times row one."
   ],
   [
    12.214,
    "Every number in row two changes, on both sides of the line."
   ],
   [
    16.146,
    "Two minus two is zero."
   ],
   [
    18.398,
    "Seven minus six is one."
   ],
   [
    20.703,
    "On the right: zero minus two is minus two, and one minus zero is one."
   ],
   [
    27.096,
    "And the plane took one step towards home."
   ],
   [
    29.727,
    "The left half is now one, three, zero, one: a shear."
   ]
  ]
 },
 "up": {
  "dur": 44.664,
  "marks": {
   "above": 8.385,
   "op": 10.99,
   "go": 13.893,
   "right": 18.021,
   "left": 26.224,
   "home": 27.76,
   "read": 28.984,
   "same": 37.279
  },
  "cues": [
   [
    0.104,
    "Now something new."
   ],
   [
    1.315,
    "In chapter nineteen we would stop here and substitute back."
   ],
   [
    5.13,
    "Gauss\u2013Jordan keeps eliminating, upward."
   ],
   [
    8.385,
    "Above the second pivot there's a three."
   ],
   [
    10.99,
    "Row one minus three times row two."
   ],
   [
    13.893,
    "Three minus three is zero, and the one stays one."
   ],
   [
    18.021,
    "On the right: one minus three times minus two is seven, and zero minus three times one is minus three."
   ],
   [
    26.224,
    "The left half is I."
   ],
   [
    27.76,
    "The plane is home."
   ],
   [
    28.984,
    "So the right half is A inverse: seven, minus three in the first row, and minus two, one in the second."
   ],
   [
    37.279,
    "Its columns are seven, minus two and minus three, one: the same two points we found in the picture."
   ]
  ]
 },
 "check": {
  "dur": 33.096,
  "marks": {
   "e1": 3.724,
   "e2": 10.312,
   "e3": 17.76,
   "e4": 24.622,
   "I": 30.456
  },
  "cues": [
   [
    0.091,
    "Always check by multiplying: A times A inverse."
   ],
   [
    3.724,
    "Row one, three, times column seven, minus two: seven minus six, one."
   ],
   [
    10.312,
    "Row one, three, times column minus three, one: minus three plus three, zero."
   ],
   [
    17.76,
    "Row two, seven, times seven, minus two: fourteen minus fourteen, zero."
   ],
   [
    24.622,
    "Row two, seven, times minus three, one: minus six plus seven, one."
   ],
   [
    30.456,
    "The identity."
   ],
   [
    31.562,
    "Gauss\u2013Jordan worked."
   ]
  ]
 },
 "why": {
  "dur": 32.112,
  "marks": {
   "E": 2.852,
   "all": 10.612,
   "left": 14.531,
   "right": 22.083,
   "rec": 28.477
  },
  "cues": [
   [
    0.104,
    "Why does the right half end up as A inverse?"
   ],
   [
    2.852,
    "Each row operation is a multiplication by an elimination matrix, from chapter twenty-one."
   ],
   [
    8.555,
    "It acts on both halves at once."
   ],
   [
    10.612,
    "Put all the steps together into one matrix, and call it E."
   ],
   [
    14.531,
    "On the left, E times A became I."
   ],
   [
    16.927,
    "So E is the matrix that undoes A: E is A inverse."
   ],
   [
    22.083,
    "On the right, E times I is just E."
   ],
   [
    24.635,
    "So the right half is A inverse, written out for us."
   ],
   [
    28.477,
    "The right half is a record of everything we did to A."
   ]
  ]
 },
 "q1": {
  "dur": 5.712,
  "marks": {},
  "cues": [
   [
    0.104,
    "Your turn."
   ],
   [
    0.99,
    "Choose the multiplier that clears the number under the pivot, and watch the plane."
   ]
  ]
 },
 "ex2": {
  "dur": 67.2,
  "marks": {
   "A": 3.164,
   "down": 7.721,
   "d2": 14.427,
   "up": 19.414,
   "u2": 24.622,
   "div": 29.349,
   "d3": 34.284,
   "read": 42.331,
   "check": 49.284,
   "plane": 61.797
  },
  "cues": [
   [
    0.104,
    "A second example, where the pivots are not one."
   ],
   [
    3.164,
    "A is two, one in the first row, and six, four in the second."
   ],
   [
    7.721,
    "Down: the multiplier is six over two, three."
   ],
   [
    11.602,
    "Row two minus three times row one."
   ],
   [
    14.427,
    "Row two becomes zero, one, and on the right, minus three, one."
   ],
   [
    19.414,
    "Up: above the second pivot there's a one."
   ],
   [
    22.266,
    "Row one minus one times row two."
   ],
   [
    24.622,
    "Row one becomes two, zero, and on the right, four, minus one."
   ],
   [
    29.349,
    "The left half isn't I yet: the first pivot is two."
   ],
   [
    32.552,
    "Divide row one by two."
   ],
   [
    34.284,
    "Two over two is one."
   ],
   [
    36.276,
    "On the right: four over two is two, and minus one over two is minus one half."
   ],
   [
    42.331,
    "So A inverse is two, minus one half in the first row, and minus three, one in the second."
   ],
   [
    49.284,
    "Check with the formula from chapter twenty-six: a d minus b c is eight minus six, two."
   ],
   [
    56.302,
    "One half of four, minus one, minus six, two gives the same matrix."
   ],
   [
    61.797,
    "On the plane, that last step was a squeeze to half the width, and it brought the plane home."
   ]
  ]
 },
 "q2": {
  "dur": 4.128,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.146,
    "Do Gauss\u2013Jordan on this matrix."
   ]
  ]
 },
 "three": {
  "dur": 50.28,
  "marks": {
   "A": 4.023,
   "aug": 10.56,
   "c1": 14.648,
   "c1b": 18.594,
   "c2": 21.68,
   "tri": 25.807,
   "up": 31.419,
   "up2": 34.466,
   "up3": 36.406,
   "I": 39.727,
   "read": 41.211
  },
  "cues": [
   [
    0.104,
    "The same method works for three by three, with more steps."
   ],
   [
    4.023,
    "A is one, two, one; two, five, three; and one, three, three."
   ],
   [
    10.56,
    "Write A, and the three by three identity beside it."
   ],
   [
    14.648,
    "Column one: row two minus two times row one, and row three minus one times row one."
   ],
   [
    21.68,
    "Column two: row three minus one times row two."
   ],
   [
    25.807,
    "Now the left half is a triangle, with ones on the diagonal."
   ],
   [
    29.974,
    "That's the end of the way down."
   ],
   [
    31.419,
    "Now go up."
   ],
   [
    32.474,
    "Row two minus row three, row one minus row three, and finally row one minus two times row two."
   ],
   [
    39.727,
    "The left half is I."
   ],
   [
    41.211,
    "So A inverse is six, minus three, one; minus three, two, minus one; and one, minus one, one."
   ]
  ]
 },
 "check3": {
  "dur": 33.048,
  "marks": {
   "e1": 2.891,
   "e2": 11.094,
   "e3": 18.685,
   "rest": 28.737
  },
  "cues": [
   [
    0.104,
    "Check a few numbers of A times A inverse."
   ],
   [
    2.891,
    "Row one of A, one, two, one, times column one of A inverse, six, minus three, one: six minus six plus one, one."
   ],
   [
    11.094,
    "Row two, two, five, three, times the same column: twelve minus fifteen plus three, zero."
   ],
   [
    18.685,
    "Row three, one, three, three, times column three, one, minus one, one: one minus three plus three, one."
   ],
   [
    28.737,
    "The other six work out the same way."
   ],
   [
    31.211,
    "A times A inverse is I."
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
    1.107,
    "One step on a three by three."
   ]
  ]
 },
 "recipe": {
  "dur": 30.864,
  "marks": {
   "r1": 1.927,
   "r2": 4.076,
   "r3": 7.982,
   "r4": 11.823,
   "r5": 14.154,
   "r6": 20.234
  },
  "cues": [
   [
    0.104,
    "So here is the recipe."
   ],
   [
    1.927,
    "Write A and I side by side."
   ],
   [
    4.076,
    "Eliminate down: zeros below each pivot."
   ],
   [
    7.982,
    "Eliminate up: zeros above each pivot."
   ],
   [
    11.823,
    "Divide each row by its pivot."
   ],
   [
    14.154,
    "Now the left half is I, and the right half is A inverse."
   ],
   [
    18.633,
    "Check by multiplying."
   ],
   [
    20.234,
    "And if a pivot is zero, and no row below can swap in, the left half can never become I."
   ],
   [
    26.966,
    "Then A has no inverse."
   ],
   [
    29.219,
    "That's chapter twenty-eight."
   ]
  ]
 },
 "wrap": {
  "dur": 25.104,
  "marks": {
   "w1": 0.99,
   "w2": 6.823,
   "w3": 14.414,
   "w4": 21.172,
   "end": 22.826
  },
  "cues": [
   [
    0.104,
    "To sum up."
   ],
   [
    0.99,
    "A times A inverse equals I is several systems at once, one for each column of I."
   ],
   [
    6.823,
    "Gauss\u2013Jordan writes A and I side by side, eliminates down, then up, then divides by the pivots."
   ],
   [
    14.414,
    "When the left half becomes I, the right half is A inverse: it recorded every step."
   ],
   [
    21.172,
    "Check by multiplying."
   ],
   [
    22.826,
    "Now try the chapter practice."
   ]
  ]
 },
 "final1": {
  "dur": 2.76,
  "marks": {},
  "cues": [
   [
    0.104,
    "Chapter practice."
   ],
   [
    1.523,
    "One step at a time."
   ]
  ]
 },
 "final2": {
  "dur": 3.912,
  "marks": {},
  "cues": [
   [
    0.104,
    "Next, whole inverses of two by two matrices."
   ]
  ]
 },
 "final3": {
  "dur": 1.92,
  "marks": {},
  "cues": [
   [
    0.104,
    "Now three by three."
   ]
  ]
 },
 "final4": {
  "dur": 3.792,
  "marks": {},
  "cues": [
   [
    0.104,
    "Last set."
   ],
   [
    1.211,
    "Choose the multipliers with your hands."
   ]
  ]
 },
 "play": {
  "dur": 12.6,
  "marks": {
   "go": 3.906
  },
  "cues": [
   [
    0.117,
    "Playground."
   ],
   [
    1.055,
    "Nothing here is marked right or wrong."
   ],
   [
    3.906,
    "Choose a row operation, set its multiplier, and watch the table and the plane."
   ],
   [
    9.414,
    "Try to bring the plane home."
   ],
   [
    10.938,
    "Press continue when you're done."
   ]
  ]
 },
 "finish": {
  "dur": 11.376,
  "marks": {},
  "cues": [
   [
    0.091,
    "Well done."
   ],
   [
    1.094,
    "That's the end of chapter twenty-seven, finding the inverse: Gauss\u2013Jordan."
   ],
   [
    6.51,
    "Next: matrices with no inverse, and the inverse of a product."
   ]
  ]
 }
};
