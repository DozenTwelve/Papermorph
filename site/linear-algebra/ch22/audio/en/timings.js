window.TIMINGS = {
 "intro": {
  "dur": 12.984,
  "marks": {
   "sub": 3.971,
   "move": 9.44
  },
  "cues": [
   [
    0.104,
    "Chapter twenty-two."
   ],
   [
    1.641,
    "Row exchanges as matrices."
   ],
   [
    3.971,
    "In chapter twenty we swapped two rows."
   ],
   [
    6.927,
    "Now that swap becomes a matrix, and we'll meet every way to put three rows in order."
   ]
  ]
 },
 "recall": {
  "dur": 50.328,
  "marks": {
   "sys": 2.812,
   "zero": 8.164,
   "ask": 11.732,
   "eye": 14.232,
   "swap": 18.216,
   "p": 21.432,
   "r1": 26.51,
   "r2": 33.75,
   "same": 41.589,
   "piv": 48.216
  },
  "cues": [
   [
    0.091,
    "Remember this system from chapter twenty."
   ],
   [
    2.812,
    "Zero x plus two y equals four, and three x plus y equals five."
   ],
   [
    8.164,
    "The pivot spot holds a zero, so we swapped the rows."
   ],
   [
    11.732,
    "Which matrix on the left does that swap?"
   ],
   [
    14.232,
    "Start from the identity."
   ],
   [
    15.742,
    "It leaves every row where it is."
   ],
   [
    18.216,
    "Now swap the rows of the identity itself."
   ],
   [
    21.432,
    "This is P: zero, one on top, and one, zero below."
   ],
   [
    26.51,
    "Row one of P is zero, one: none of row one, all of row two."
   ],
   [
    32.122,
    "So row two goes on top."
   ],
   [
    33.75,
    "Row two of P is one, zero: all of row one, none of row two."
   ],
   [
    39.57,
    "So row one goes to the bottom."
   ],
   [
    41.589,
    "The rows have traded places."
   ],
   [
    43.568,
    "In the picture nothing moves; the two lines just trade colours."
   ],
   [
    48.216,
    "And now the pivot is three."
   ]
  ]
 },
 "name": {
  "dur": 26.112,
  "marks": {
   "name": 0.091,
   "rows": 6.523,
   "ones": 10.234,
   "where": 14.792,
   "name2": 21.341
  },
  "cues": [
   [
    0.091,
    "A matrix like this is called a permutation matrix."
   ],
   [
    4.062,
    "A permutation is a change of order."
   ],
   [
    6.523,
    "It's the identity with its rows in a new order."
   ],
   [
    10.234,
    "Every row has exactly one 1, and so does every column."
   ],
   [
    14.792,
    "The 1 in row one says which row goes on top."
   ],
   [
    17.878,
    "Here it sits in column two, so row two goes on top."
   ],
   [
    21.341,
    "We call this one P one two, because it swaps rows one and two."
   ]
  ]
 },
 "three": {
  "dur": 41.328,
  "marks": {
   "sys": 2.305,
   "p": 10.729,
   "r1": 19.167,
   "r2": 24.258,
   "r3": 28.581,
   "tri": 33.529,
   "same": 35.534
  },
  "cues": [
   [
    0.104,
    "Now three equations."
   ],
   [
    2.305,
    "Here is chapter twenty's system after column one."
   ],
   [
    5.794,
    "The second pivot spot holds a zero, but row three has a one below it."
   ],
   [
    10.729,
    "To swap rows two and three, take the three by three identity and swap its rows two and three."
   ],
   [
    17.63,
    "That's P two three."
   ],
   [
    19.167,
    "Row one of P is one, zero, zero: row one stays on top."
   ],
   [
    24.258,
    "Row two is zero, zero, one: it takes row three."
   ],
   [
    28.581,
    "Row three is zero, one, zero: it takes row two."
   ],
   [
    33.529,
    "Now the table is a triangle."
   ],
   [
    35.534,
    "And the planes have not moved at all: the same three equations, in a new order."
   ]
  ]
 },
 "q1": {
  "dur": 4.56,
  "marks": {},
  "cues": [
   [
    0.104,
    "Quick check."
   ],
   [
    1.159,
    "Build the matrix that swaps rows one and three."
   ]
  ]
 },
 "twice": {
  "dur": 32.136,
  "marks": {
   "again": 2.279,
   "r1": 6.979,
   "back": 10.951,
   "pp": 12.969,
   "undo": 15.755,
   "calc": 18.086,
   "calc2": 25.0,
   "eye": 30.117
  },
  "cues": [
   [
    0.091,
    "What happens if we swap twice?"
   ],
   [
    2.279,
    "Put the answer back in, and multiply by P one two once more."
   ],
   [
    6.979,
    "Row one of P takes row two, which is now the old row one."
   ],
   [
    10.951,
    "Everything is back where it started."
   ],
   [
    12.969,
    "So P times P is the identity: a swap undoes itself."
   ],
   [
    18.086,
    "We can check it on P itself."
   ],
   [
    19.896,
    "Row one of P, zero, one, takes row two of P, which is one, zero."
   ],
   [
    25.0,
    "Row two of P, one, zero, takes row one of P, which is zero, one."
   ],
   [
    30.117,
    "The answer is the identity."
   ]
  ]
 },
 "six": {
  "dur": 37.32,
  "marks": {
   "top": 3.138,
   "next": 5.534,
   "last": 8.451,
   "count": 10.677,
   "i": 16.562,
   "swaps": 18.815,
   "cycles": 25.859,
   "two": 34.023
  },
  "cues": [
   [
    0.117,
    "How many ways can three rows be put in order?"
   ],
   [
    3.138,
    "Any of the three can go on top."
   ],
   [
    5.534,
    "Then either of the two that are left goes second, and the last one fills the bottom."
   ],
   [
    10.677,
    "Three times two times one: six orders, so six permutation matrices."
   ],
   [
    16.562,
    "The identity keeps the order."
   ],
   [
    18.815,
    "Three of them swap one pair: rows one and two, rows one and three, or rows two and three."
   ],
   [
    25.859,
    "And two of them move every row: each row moves down one place and the bottom one comes to the top, or the other way round."
   ],
   [
    34.023,
    "Each of those two is one swap after another."
   ]
  ]
 },
 "cycle": {
  "dur": 53.088,
  "marks": {
   "want": 3.32,
   "s1": 7.201,
   "s2": 11.107,
   "read": 15.677,
   "r2": 21.849,
   "r3": 25.872,
   "same": 30.404,
   "again": 35.82,
   "twice": 40.234,
   "third": 47.578
  },
  "cues": [
   [
    0.104,
    "Let's build one of the two that move every row."
   ],
   [
    3.32,
    "We want row three on top, then row one, then row two."
   ],
   [
    7.201,
    "Start from the identity, and swap its rows one and three."
   ],
   [
    11.107,
    "Then swap its rows two and three."
   ],
   [
    13.685,
    "That's one swap after another."
   ],
   [
    15.677,
    "Now read the rows of P."
   ],
   [
    17.578,
    "Row one is zero, zero, one: it takes row three."
   ],
   [
    21.849,
    "Row two is one, zero, zero: it takes row one."
   ],
   [
    25.872,
    "Row three is zero, one, zero: it takes row two."
   ],
   [
    30.404,
    "The answer starts with four y plus z equals two, and the planes have not moved."
   ],
   [
    35.82,
    "Now put the answer back in, and multiply by this P once more."
   ],
   [
    40.234,
    "Every row moves down one more place."
   ],
   [
    43.125,
    "That's not where we started: this P does not undo itself."
   ],
   [
    47.578,
    "A third time brings every row home."
   ],
   [
    49.987,
    "So P times P times P is the identity."
   ]
  ]
 },
 "q2": {
  "dur": 5.016,
  "marks": {},
  "cues": [
   [
    0.104,
    "Your turn."
   ],
   [
    0.99,
    "Change the numbers of P until the table is a triangle."
   ]
  ]
 },
 "right": {
  "dur": 57.48,
  "marks": {
   "sys": 2.018,
   "cols": 9.479,
   "c1": 13.906,
   "c2": 23.281,
   "swap": 26.654,
   "eq": 28.555,
   "xy": 35.911,
   "pt": 41.758,
   "flip": 45.169,
   "rows": 50.326
  },
  "cues": [
   [
    0.104,
    "So far P stood on the left."
   ],
   [
    2.018,
    "Now put it on the right of A, with x plus two y equals five, and three x plus four y equals eleven."
   ],
   [
    9.479,
    "On the right, P mixes the columns of A, not its rows."
   ],
   [
    13.906,
    "Column one of P is zero, one: none of column one, all of column two."
   ],
   [
    20.117,
    "So the new first column is A's second column."
   ],
   [
    23.281,
    "And the new second column is A's first."
   ],
   [
    26.654,
    "The columns trade places."
   ],
   [
    28.555,
    "Now the equations read two x plus y equals five, and four x plus three y equals eleven."
   ],
   [
    35.911,
    "The numbers in front of x and y have traded, so x and y trade roles."
   ],
   [
    41.758,
    "The meeting point moves from one, two to two, one."
   ],
   [
    45.169,
    "The whole picture flips over the diagonal, the line where x equals y."
   ],
   [
    50.326,
    "So P on the left swaps rows and moves nothing."
   ],
   [
    53.75,
    "P on the right swaps columns, and swaps the unknowns."
   ]
  ]
 },
 "right2": {
  "dur": 42.24,
  "marks": {
   "sys": 1.302,
   "swap": 7.513,
   "eq": 11.602,
   "blue": 18.464,
   "coral": 29.466,
   "pt": 32.487,
   "check": 36.328
  },
  "cues": [
   [
    0.104,
    "One more on the right."
   ],
   [
    1.302,
    "x plus y equals four, and x minus two y equals one."
   ],
   [
    5.82,
    "They meet at three, one."
   ],
   [
    7.513,
    "Put P one two on the right of A: the columns of A trade places."
   ],
   [
    11.602,
    "The equations become x plus y equals four, and minus two x plus y equals one."
   ],
   [
    18.464,
    "Look at the blue line."
   ],
   [
    19.727,
    "Its two numbers were one and one, so trading them changes nothing, and it stays where it was."
   ],
   [
    26.445,
    "It is its own mirror image in the diagonal."
   ],
   [
    29.466,
    "The coral line flips over the diagonal."
   ],
   [
    32.487,
    "So the meeting point moves from three, one to one, three."
   ],
   [
    36.328,
    "Check it: one plus three is four, and minus two plus three is one."
   ]
  ]
 },
 "q3": {
  "dur": 6.432,
  "marks": {},
  "cues": [
   [
    0.104,
    "Your turn."
   ],
   [
    1.068,
    "Change the numbers of P, on the right of A, until the lines meet at the ring."
   ]
  ]
 },
 "wrap": {
  "dur": 30.312,
  "marks": {
   "w1": 1.003,
   "w2": 6.836,
   "w3": 12.07,
   "w4": 18.581,
   "end": 28.034
  },
  "cues": [
   [
    0.104,
    "Let's sum up."
   ],
   [
    1.003,
    "A permutation matrix P is the identity with its rows in a new order."
   ],
   [
    6.836,
    "P times A puts the rows of A in that order; the lines and planes do not move."
   ],
   [
    12.07,
    "A times P reorders the columns instead: the unknowns trade places, and the picture flips."
   ],
   [
    18.581,
    "A swap undoes itself, P times P is the identity, and three rows have six orders, so six permutation matrices."
   ],
   [
    28.034,
    "Now try the chapter practice."
   ]
  ]
 },
 "final1": {
  "dur": 2.856,
  "marks": {},
  "cues": [
   [
    0.104,
    "Chapter practice."
   ],
   [
    1.576,
    "Find where the ones go."
   ]
  ]
 },
 "final2": {
  "dur": 2.784,
  "marks": {},
  "cues": [
   [
    0.104,
    "Set two."
   ],
   [
    1.081,
    "Reorder the rows with P."
   ]
  ]
 },
 "final3": {
  "dur": 2.544,
  "marks": {},
  "cues": [
   [
    0.104,
    "Set three."
   ],
   [
    1.198,
    "True or false?"
   ]
  ]
 },
 "final4": {
  "dur": 4.848,
  "marks": {},
  "cues": [
   [
    0.104,
    "Last set."
   ],
   [
    1.224,
    "Build each permutation matrix with your own hands."
   ]
  ]
 },
 "play": {
  "dur": 10.632,
  "marks": {
   "go": 4.167
  },
  "cues": [
   [
    0.104,
    "Playground."
   ],
   [
    1.107,
    "Nothing here is marked right or wrong."
   ],
   [
    4.167,
    "Change the numbers of P, try every order you like, and watch the rows move while the planes stay."
   ]
  ]
 },
 "finish": {
  "dur": 14.136,
  "marks": {},
  "cues": [
   [
    0.104,
    "Well done."
   ],
   [
    1.094,
    "That's the end of chapter twenty-two, Row Exchanges as Matrices, and the end of unit two."
   ],
   [
    7.292,
    "Next: unit three, where we multiply matrices by matrices, and learn how to undo them."
   ]
  ]
 }
};
