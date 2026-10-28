window.TIMINGS = {
 "intro": {
  "dur": 12.888,
  "marks": {
   "sub": 2.852,
   "move": 8.125
  },
  "cues": [
   [
    0.104,
    "Chapter forty."
   ],
   [
    1.367,
    "The column space."
   ],
   [
    2.852,
    "Every matrix carries a subspace with it: all the combinations of its columns."
   ],
   [
    8.125,
    "And that subspace tells you exactly which right sides b you can solve for."
   ]
  ]
 },
 "recap": {
  "dur": 21.936,
  "marks": {
   "cols": 2.161,
   "sheet": 7.383,
   "reach": 11.302,
   "now": 17.917
  },
  "cues": [
   [
    0.104,
    "Remember chapter fourteen."
   ],
   [
    2.161,
    "We took two columns and mixed them: x times column one plus y times column two."
   ],
   [
    7.383,
    "Every mix landed in one flat sheet through the origin."
   ],
   [
    11.302,
    "So A x equals b could be solved only when b was on the sheet."
   ],
   [
    15.326,
    "Off the sheet, no mix reaches it."
   ],
   [
    17.917,
    "That sheet is a subspace, and today it gets its name."
   ]
  ]
 },
 "name": {
  "dur": 36.864,
  "marks": {
   "A": 2.591,
   "c1": 5.547,
   "c2": 8.333,
   "mix": 13.672,
   "m11": 19.049,
   "m1n": 21.628,
   "many": 25.339,
   "name": 31.328
  },
  "cues": [
   [
    0.117,
    "Here is the matrix from the lecture."
   ],
   [
    2.591,
    "A has three rows and two columns."
   ],
   [
    5.547,
    "Column one is one, two, four."
   ],
   [
    8.333,
    "Column two is three, three, one."
   ],
   [
    11.25,
    "Each column is a vector in R three."
   ],
   [
    13.672,
    "Now take every combination, x times column one plus y times column two."
   ],
   [
    19.049,
    "One and one gives four, five, five."
   ],
   [
    21.628,
    "One and minus one gives minus two, minus one, three."
   ],
   [
    25.339,
    "Whole numbers, fractions, negatives: let x and y be anything."
   ],
   [
    31.328,
    "All these combinations together are called the column space of A."
   ],
   [
    35.365,
    "We write it C of A."
   ]
  ]
 },
 "sub": {
  "dur": 60.36,
  "marks": {
   "two": 3.607,
   "two2": 10.612,
   "add": 16.51,
   "mix": 20.482,
   "mult": 34.18,
   "mult2": 43.893,
   "zero": 50.938,
   "yes": 54.505
  },
  "cues": [
   [
    0.091,
    "Is the column space a subspace?"
   ],
   [
    2.604,
    "Let's test it."
   ],
   [
    3.607,
    "Take two vectors in it: four, five, five, which is one times column one plus one times column two, and two, one, minus three, which is minus one times column one plus one times column two."
   ],
   [
    16.51,
    "Add them, tip to tail: the sum is six, six, two."
   ],
   [
    20.482,
    "And the mixes add too: one plus minus one is zero, and one plus one is two."
   ],
   [
    26.953,
    "Zero times column one plus two times column two is six, six, two."
   ],
   [
    32.669,
    "A combination again."
   ],
   [
    34.18,
    "Now multiply a combination by a number."
   ],
   [
    37.005,
    "Minus one half times six, six, two is minus three, minus three, minus one."
   ],
   [
    43.893,
    "Its mix gets multiplied by minus one half too: zero, and minus one."
   ],
   [
    49.479,
    "A combination again."
   ],
   [
    50.938,
    "And zero times both columns gives the zero vector."
   ],
   [
    54.505,
    "So sums and multiples never leave."
   ],
   [
    57.422,
    "The column space is always a subspace."
   ]
  ]
 },
 "plane": {
  "dur": 29.448,
  "marks": {
   "two": 1.328,
   "fill": 6.406,
   "zero": 9.349,
   "edge": 14.714,
   "back": 20.299,
   "not": 25.247
  },
  "cues": [
   [
    0.104,
    "What shape is it?"
   ],
   [
    1.328,
    "The two columns point in different directions: neither is a multiple of the other."
   ],
   [
    6.406,
    "So their combinations fill a whole flat plane."
   ],
   [
    9.349,
    "And it passes through the origin, since zero times both columns is zero."
   ],
   [
    14.714,
    "Turn the picture to look along the plane: it shrinks to a line, and both columns lie in it."
   ],
   [
    20.299,
    "For this A, C of A is a plane through the origin in R three."
   ],
   [
    25.247,
    "It's not all of R three: most vectors in space are off this plane."
   ]
  ]
 },
 "q1": {
  "dur": 5.088,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.133,
    "Compute A times x, a vector in the column space."
   ]
  ]
 },
 "ax": {
  "dur": 40.968,
  "marks": {
   "eqs": 1.25,
   "cols": 13.867,
   "always": 19.167,
   "so": 21.888,
   "and": 27.266,
   "rule": 35.612
  },
  "cues": [
   [
    0.091,
    "Now the big point."
   ],
   [
    1.25,
    "A x equals b is three equations with two unknowns."
   ],
   [
    5.925,
    "x plus three y equals b one."
   ],
   [
    8.62,
    "Two x plus three y equals b two."
   ],
   [
    11.523,
    "Four x plus y equals b three."
   ],
   [
    13.867,
    "Read down the columns: A x is x times column one plus y times column two."
   ],
   [
    19.167,
    "So A x is always in the column space."
   ],
   [
    21.888,
    "That means A x equals b can be solved only when b is in C of A."
   ],
   [
    27.266,
    "And when b is in C of A, it is some combination of the columns, and that combination's x and y solve the equations."
   ],
   [
    35.612,
    "A x equals b is solvable exactly when b is in the column space of A."
   ]
  ]
 },
 "rows": {
  "dur": 37.776,
  "marks": {
   "rows": 2.266,
   "b1": 11.81,
   "meet": 16.81,
   "off": 25.286,
   "slide": 28.867,
   "on": 34.622
  },
  "cues": [
   [
    0.104,
    "Let's see it in both pictures at once."
   ],
   [
    2.266,
    "With two unknowns, each equation is a line in the x y plane: blue for the first, coral for the second, yellow for the third."
   ],
   [
    11.81,
    "Take b equals four, five, five."
   ],
   [
    14.414,
    "In space, b sits on the plane."
   ],
   [
    16.81,
    "And down here, the three lines meet at one point, one, one."
   ],
   [
    21.419,
    "That point is the mix: x equals one, y equals one."
   ],
   [
    25.286,
    "Now lift b off the plane: four, five, six."
   ],
   [
    28.867,
    "Only the third line slides."
   ],
   [
    30.99,
    "The three lines no longer share a point."
   ],
   [
    33.411,
    "No solution."
   ],
   [
    34.622,
    "Put b back on the plane, and the lines meet again."
   ]
  ]
 },
 "decide": {
  "dur": 61.152,
  "marks": {
   "e12": 5.234,
   "ey": 11.146,
   "ex1": 13.659,
   "t1": 23.099,
   "ex2": 29.831,
   "t2": 42.161,
   "ex3": 47.227,
   "t3": 53.177,
   "no": 57.656
  },
  "cues": [
   [
    0.104,
    "How can you tell without a picture?"
   ],
   [
    1.914,
    "Solve two equations, then test the third."
   ],
   [
    5.234,
    "Subtract the first equation from the second: x equals b two minus b one."
   ],
   [
    11.146,
    "Then the first equation gives y."
   ],
   [
    13.659,
    "For b equals four, five, five: x equals five minus four, one."
   ],
   [
    19.102,
    "Then one plus three y equals four, so y is one."
   ],
   [
    23.099,
    "Test the third: four times one plus one is five."
   ],
   [
    26.784,
    "Yes, it matches b three."
   ],
   [
    28.763,
    "Solvable."
   ],
   [
    29.831,
    "For b equals minus two, minus one, three: x equals minus one minus minus two, which is one."
   ],
   [
    37.695,
    "One plus three y equals minus two, so y is minus one."
   ],
   [
    42.161,
    "Third: four minus one is three."
   ],
   [
    44.987,
    "It matches."
   ],
   [
    46.172,
    "Solvable."
   ],
   [
    47.227,
    "For b equals one, two, three: x is one, y is zero."
   ],
   [
    53.177,
    "Third: four times one plus zero is four, not three."
   ],
   [
    57.656,
    "No solution: b is not in the column space."
   ]
  ]
 },
 "more": {
  "dur": 66.96,
  "marks": {
   "b1": 3.398,
   "x1": 6.263,
   "y1": 12.474,
   "t1": 20.846,
   "mix1": 28.385,
   "b2": 37.669,
   "x2": 40.938,
   "y2": 44.466,
   "t2": 50.482,
   "no2": 57.318
  },
  "cues": [
   [
    0.104,
    "Two more, step by step."
   ],
   [
    1.875,
    "Watch both pictures."
   ],
   [
    3.398,
    "b equals five, four, minus two."
   ],
   [
    6.263,
    "Subtract the first equation from the second: x equals four minus five, which is minus one."
   ],
   [
    12.474,
    "The first equation: minus one plus three y equals five."
   ],
   [
    17.669,
    "So three y is six, and y is two."
   ],
   [
    20.846,
    "Test the third: four times minus one, plus two, is minus two."
   ],
   [
    25.885,
    "That's b three."
   ],
   [
    27.148,
    "It matches!"
   ],
   [
    28.385,
    "So b is minus one times column one plus two times column two."
   ],
   [
    33.385,
    "And down below, the three lines meet at minus one, two."
   ],
   [
    37.669,
    "Now b equals zero, three, three."
   ],
   [
    40.938,
    "x equals three minus zero, which is three."
   ],
   [
    44.466,
    "The first equation: three plus three y equals zero, so y is minus one."
   ],
   [
    50.482,
    "Test the third: four times three, minus one, is eleven."
   ],
   [
    55.052,
    "But b three is three."
   ],
   [
    57.318,
    "Eleven is not three: no solution."
   ],
   [
    60.456,
    "In space, b sits off the plane."
   ],
   [
    62.865,
    "Below, the yellow line misses the point where the other two meet."
   ]
  ]
 },
 "q2": {
  "dur": 5.976,
  "marks": {},
  "cues": [
   [
    0.104,
    "Your turn."
   ],
   [
    1.068,
    "Change only the bottom number of b until A x equals b can be solved."
   ]
  ]
 },
 "shapes": {
  "dur": 47.352,
  "marks": {
   "floor": 3.255,
   "line": 20.365,
   "all": 36.38
  },
  "cues": [
   [
    0.104,
    "Different matrices have different column spaces."
   ],
   [
    3.255,
    "Take columns one, zero, zero and zero, one, zero."
   ],
   [
    8.177,
    "Their combinations are every vector with bottom number zero: the floor."
   ],
   [
    12.812,
    "C of A is the floor, so A x equals b is solvable exactly when b three is zero."
   ],
   [
    20.365,
    "Now take columns one, one, one and two, two, two."
   ],
   [
    24.258,
    "Column two is twice column one, so every combination is a multiple of one, one, one."
   ],
   [
    31.992,
    "C of A is just a line."
   ],
   [
    33.646,
    "Only b's on that line can be solved."
   ],
   [
    36.38,
    "And in chapter fourteen, three columns that point in three truly different directions filled all of space: C of A was R three, and every b could be solved."
   ]
  ]
 },
 "q3": {
  "dur": 3.936,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.159,
    "For each matrix, which b can be reached?"
   ]
  ]
 },
 "q4": {
  "dur": 3.36,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.094,
    "What shape is this column space?"
   ]
  ]
 },
 "wrap": {
  "dur": 25.944,
  "marks": {
   "w1": 1.016,
   "w2": 5.443,
   "w3": 11.172,
   "w4": 16.146,
   "end": 24.01
  },
  "cues": [
   [
    0.104,
    "To sum up."
   ],
   [
    1.016,
    "The column space C of A is every combination of the columns of A."
   ],
   [
    5.443,
    "It's always a subspace: sums and multiples of combinations are combinations."
   ],
   [
    11.172,
    "A x equals b can be solved exactly when b is in the column space."
   ],
   [
    16.146,
    "It can be a point, a line, a plane, or all of space."
   ],
   [
    19.805,
    "For the lecture's A, it's a plane through the origin in R three."
   ],
   [
    24.01,
    "Now try the chapter practice."
   ]
  ]
 },
 "final1": {
  "dur": 4.056,
  "marks": {},
  "cues": [
   [
    0.104,
    "Chapter practice."
   ],
   [
    1.497,
    "Compute vectors in the column space."
   ]
  ]
 },
 "final2": {
  "dur": 2.76,
  "marks": {},
  "cues": [
   [
    0.104,
    "Next."
   ],
   [
    0.99,
    "Is b in the column space?"
   ]
  ]
 },
 "final3": {
  "dur": 2.208,
  "marks": {},
  "cues": [
   [
    0.104,
    "Now find the mix that reaches b."
   ]
  ]
 },
 "final4": {
  "dur": 2.784,
  "marks": {},
  "cues": [
   [
    0.091,
    "Last set."
   ],
   [
    1.211,
    "Move b with your hands."
   ]
  ]
 },
 "play": {
  "dur": 10.992,
  "marks": {
   "go": 4.01
  },
  "cues": [
   [
    0.104,
    "Playground."
   ],
   [
    1.12,
    "Nothing here is marked right or wrong."
   ],
   [
    4.01,
    "Move b, change the mix, change the columns, turn the picture, and watch the three lines below."
   ]
  ]
 },
 "finish": {
  "dur": 11.4,
  "marks": {},
  "cues": [
   [
    0.104,
    "Well done."
   ],
   [
    1.12,
    "That's the end of chapter forty, the column space, and the end of unit five."
   ],
   [
    6.628,
    "Next: unit six, and a second subspace, the nullspace."
   ]
  ]
 }
};
