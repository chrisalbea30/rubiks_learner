# CFOP Speedcubing Guide

Oct 5, 2026 · @Optinet Solutions

## Notation legend

Hold the cube with one face toward you (Front) and one face on top (Up). Every move is read as if you are looking straight at that face. A letter alone means turn that face 90° clockwise.

| Symbol | Meaning |
| --- | --- |
| R | Right face, clockwise |
| L | Left face, clockwise |
| U | Up (top) face, clockwise |
| D | Down (bottom) face, clockwise |
| F | Front face, clockwise |
| B | Back face, clockwise |
| ' (prime) | Counter-clockwise. R' = right face counter-clockwise |
| 2 | Turn twice (180°). R2 = right face half turn; direction doesn't matter |
| r, l, u, d, f, b (lowercase) | Wide move: turn that face plus the middle layer next to it. Also written Rw, Lw, etc. |
| M | Middle slice (between L and R), turns the same direction as L |
| E | Equator slice (between U and D), turns the same direction as D |
| S | Standing slice (between F and B), turns the same direction as F |
| x | Rotate the whole cube like an R move |
| y | Rotate the whole cube like a U move |
| z | Rotate the whole cube like an F move |
| ( ) | Brackets only group moves into chunks to make them easier to memorize |

Two chunks appear so often they have names. The **sexy move** is R U R' U'. The **sledgehammer** is R' F R F'.

All algorithms below assume you solved the cross on the bottom (white on D) and the last layer is on top (yellow on U). Clockwise for R means the front-right column moves upward.

## Stage 1: Cross

The cross has no algorithms to memorize; it is solved by intuition. The goal is four white edges on the bottom, each one also matching the center color on its side.

1. Find a white edge piece. Note its second color (for example, white-red).
2. Turn the side it's on, or the top, until that edge sits above the red center.
3. Turn that face twice (for example, F2) to drop it into the bottom. Repeat for the other three edges.
4. If an edge lands flipped (white facing sideways), hold it at the front of the bottom layer and use: F' D R' D'

Tips for getting faster:

- Solve the cross on the **bottom** from the start, not on top then flip. You won't have to rotate the cube and can see F2L pieces sooner.
- Every cross can be solved in 8 moves or fewer. Use your 15-second inspection to plan the whole cross before turning.
- Practice "color neutral" or "dual color" (white or yellow) crosses later; it lets you pick the easier cross each solve.

## Stage 2: F2L (First Two Layers)

F2L pairs one white corner with its matching middle-layer edge, then inserts both into a slot together. There are 41 official cases, but most fast solvers learn F2L intuitively first: bring the pair together on top, then drop it in with one of the three basic inserts.

Every case below assumes you are inserting into the **front-right slot**, with the corner sitting at the top-front-right position unless stated. "Edge front-color" means the edge's sticker that matches the front center. For other slots, turn U to bring pieces into place or rotate the cube with y.

Each picture below unfolds the cube: the top face on top, the front face underneath it, and the right face to the right of the front. The front-right slot is where the front and right faces meet. Only the pair you're inserting and the already-solved pieces are colored; everything else is gray. B1–B4 are Basic 1–4, and 5–17 match the case numbers in the tables.

&#91;image: All 17 F2L cases, unfolded view\]

**The three basic inserts** (the pair is already lined up):

| Case | Corner | Edge | Algorithm |
| --- | --- | --- | --- |
| Basic 1 | Top-front-right, white facing right | Top-back, front-color on top | R U R' |
| Basic 2 | Top-front-right, white facing front | Top-left, front-color facing left | F' U' F |
| Basic 3 | Top-front-right, white facing front | Top-right, front-color on top | U R U' R' |
| Basic 4 | Top-front-right, white facing right | Top-front, front-color facing front | U' F' U F |

**Common cases, both pieces on top:**

| Case | Corner | Edge | Algorithm |
| --- | --- | --- | --- |
| 5 | White facing front | Top-back, front-color on top | U' R U R' U2 R U' R' |
| 6 | White facing right | Top-left, front-color facing left | U F' U' F U2 F' U F |
| 7 | White facing front | Top-left, front-color on top | U' R U2 R' U2 R U' R' |
| 8 | White facing right | Top-back, front-color facing back | U F' U2 F U2 F' U F |
| 9 | White facing right | Top-right, front-color on top | U' R U' R' U R U R' |
| 10 | White facing front | Top-front, front-color facing front | U F' U F U' F' U' F |

**Corner with white facing up:**

| Case | Edge | Algorithm |
| --- | --- | --- |
| 11 | Top-right, front-color on top | R U2 R' U' R U R' |
| 12 | Top-front, front-color facing front | F' U2 F U F' U' F |
| 13 | Top-back, front-color on top | U R U2 R' U R U' R' |
| 14 | Top-left, front-color facing left | U' F' U2 F U' F' U F |

**Pieces stuck in the slot:**

| Case | Corner | Edge | Algorithm |
| --- | --- | --- | --- |
| 15 | In slot, white facing front | Top-right, front-color on top | R U' R' U R U' R' |
| 16 | Top, white facing up | In slot, correct | R U R' U' R U R' U' R U R' |
| 17 | In slot, white facing front | In slot, correct | R U' R' U' R U R' U' R U2 R' |

If a corner or edge is stuck in the wrong slot, pop it out with a basic insert (like R U R') and treat it as a fresh case. Learning the full 41 cases comes later, once intuitive F2L feels comfortable.

## Stage 3: OLL (Orient Last Layer)

OLL makes the entire top face yellow. Start with 2-look OLL (9 algorithms), then work toward all 57. Before any algorithm, turn U until the top matches the case's holding position.

### 2-look OLL, step 1: make a yellow cross (edges)

&#91;image: Line, L shape and dot, top view\]

These show the top face from above, with the front at the bottom of the picture. Only the edges matter here, so the corners are gray.

| Top shape | How to hold | Algorithm |
| --- | --- | --- |
| Line | Line horizontal (left to right) | F R U R' U' F' |
| L shape | L in the back-left (edges at left and back) | F U R U' R' F' |
| Dot | Any way | F R U R' U' F', then do the L-shape case |

### 2-look OLL, step 2: orient the corners

These are OLL 21–27 from the full list. "Side" means yellow stickers showing on the side faces of the top layer.

| Case | Recognition and how to hold | Algorithm |
| --- | --- | --- |
| 21 H | No corners up; yellow sides on front and back (two each) | R U2 R' U' R U R' U' R U' R' |
| 22 Pi | No corners up; two yellow on the left side, one each on front and back | R U2 R2 U' R2 U' R2 U2 R |
| 23 Headlights | Two front corners up; two yellow on the back side | R2 D' R U2 R' D R U2 R |
| 24 Chameleon (T) | Two right corners up; yellow on front and back | r U R' U' r' F R F' |
| 25 Bowtie (L) | Back-right and front-left corners up; yellow on front and left | F' r U R' U' r' F R |
| 26 Antisune | One corner up, held at back-right | R U2 R' U' R U' R' |
| 27 Sune | One corner up, held at front-left | R U R' U R U2 R' |

### Full OLL: all 57 cases

The numbers are the standard ones used on sites like jperm.net and speedcubedb.com, where you can see a picture of each case. Look up the picture by number; the algorithm below solves it.

Each picture is the top of the cube seen from above, with the front at the bottom of the picture. Yellow squares are yellow stickers facing up; the yellow bars around the edge are yellow stickers facing sideways. Hold the cube exactly as pictured, then do the algorithm with the same number. Cases 21–27 are the seven 2-look corner cases above.

&#91;image: All 57 OLL cases, top view\]

| # | Group | Algorithm |
| --- | --- | --- |
| 1 | Dot | R U2 R2 F R F' U2 R' F R F' |
| 2 | Dot | F R U R' U' F' f R U R' U' f' |
| 3 | Dot | f R U R' U' f' U' F R U R' U' F' |
| 4 | Dot | f R U R' U' f' U F R U R' U' F' |
| 5 | Square | r' U2 R U R' U r |
| 6 | Square | r U2 R' U' R U' r' |
| 7 | Lightning | r U R' U R U2 r' |
| 8 | Lightning | l' U' L U' L' U2 l |
| 9 | Fish | R U R' U' R' F R2 U R' U' F' |
| 10 | Fish | R U R' U R' F R F' R U2 R' |
| 11 | Lightning | r U R' U R' F R F' R U2 r' |
| 12 | Lightning | M' R' U' R U' R' U2 R U' M |
| 13 | Knight move | F U R U' R2 F' R U R U' R' |
| 14 | Knight move | R' F R U R' F' R F U' F' |
| 15 | Knight move | r' U' r R' U' R U r' U r |
| 16 | Knight move | r U r' R U R' U' r U' r' |
| 17 | Dot | R U R' U R' F R F' U2 R' F R F' |
| 18 | Dot | r U R' U R U2 r2 U' R U' R' U2 r |
| 19 | Dot | M U R U R' U' M' R' F R F' |
| 20 | Dot | r U R' U' M2 U R U' R' U' M' |
| 21 | Cross (H) | R U2 R' U' R U R' U' R U' R' |
| 22 | Cross (Pi) | R U2 R2 U' R2 U' R2 U2 R |
| 23 | Cross (Headlights) | R2 D' R U2 R' D R U2 R |
| 24 | Cross (Chameleon) | r U R' U' r' F R F' |
| 25 | Cross (Bowtie) | F' r U R' U' r' F R |
| 26 | Cross (Antisune) | R U2 R' U' R U' R' |
| 27 | Cross (Sune) | R U R' U R U2 R' |
| 28 | Corners oriented | r U R' U' M U R U' R' |
| 29 | Awkward | R U R' U' R U' R' F' U' F R U R' |
| 30 | Awkward | F R' F R2 U' R' U' R U R' F2 |
| 31 | P shape | R' U' F U R U' R' F' R |
| 32 | P shape | L U F' U' L' U L F L' |
| 33 | T shape | R U R' U' R' F R F' |
| 34 | C shape | R U R2 U' R' F R U R U' F' |
| 35 | Fish | R U2 R2 F R F' R U2 R' |
| 36 | W shape | L' U' L U' L' U L U L F' L' F |
| 37 | Fish | F R' F' R U R U' R' |
| 38 | W shape | R U R' U R U' R' U' R' F R F' |
| 39 | Lightning | L F' L' U' L U F U' L' |
| 40 | Lightning | R' F R U R' U' F' U R |
| 41 | Awkward | R U R' U R U2 R' F R U R' U' F' |
| 42 | Awkward | R' U' R U' R' U2 R F R U R' U' F' |
| 43 | P shape | F' U' L' U L F |
| 44 | P shape | F U R U' R' F' |
| 45 | T shape | F R U R' U' F' |
| 46 | C shape | R' U' R' F R F' U R |
| 47 | L shape | R' U' R' F R F' R' F R F' U R |
| 48 | L shape | F R U R' U' R U R' U' F' |
| 49 | L shape | r U' r2 U r2 U r2 U' r |
| 50 | L shape | r' U r2 U' r2 U' r2 U r' |
| 51 | Line (I) | F U R U' R' U R U' R' F' |
| 52 | Line (I) | R U R' U R U' B U' B' R' |
| 53 | L shape | l' U2 L U L' U' L U L' U l |
| 54 | L shape | r U2 R' U' R U R' U' R U' r' |
| 55 | Line (I) | R' F R U R U' R2 F' R2 U' R' U R U R' |
| 56 | Line (I) | r' U' r U' R' U R U' R' U R r' U r |
| 57 | Corners oriented | R U R' U' M' U R U' r' |

Every algorithm in this table was checked with a cube simulator: each keeps your first two layers intact, and together they solve 57 distinct cases.

## Stage 4: PLL (Permute Last Layer)

PLL moves the yellow pieces into their correct spots without un-yellowing the top. Start with 2-look PLL (6 algorithms), then learn all 21. You may need one final U turn (called AUF) after any PLL.

**Headlights** are two corners on the same side whose side stickers are the same color.

Pictures of the six 2-look cases (T, Y, Ua, Ub, H, Z) are in the full PLL chart below.

### 2-look PLL, step 1: solve the corners

| Case | How to hold | Algorithm |
| --- | --- | --- |
| Headlights on one side | Headlights on the left (T perm) | R U R' U' R' F R2 U' R' U' R U R' F' |
| No headlights anywhere | Any way (Y perm) | F R U' R' U' R U R' F' R U R' U' R' F R F' |
| Headlights on all four sides | Corners are done; go to step 2 | — |

### 2-look PLL, step 2: solve the edges

| Case | How to hold | Algorithm |
| --- | --- | --- |
| Ua (3 edges cycle) | Solved side at the back | M2 U M U2 M' U M2 |
| Ub (3 edges cycle the other way) | Solved side at the back | M2 U' M U2 M' U' M2 |
| H (opposite edges swap) | Any way | M2 U M2 U2 M2 U M2 |
| Z (adjacent edges swap) | Front edge swapped with left, back with right; finish with U' | M' U M2 U M2 U M' U2 M2 |

If you're not sure whether it's Ua or Ub, try one; if the edges cycle the wrong way, the other one will finish it.

### Full PLL: all 21 cases

Each picture is the top of the cube seen from above, with the front face at the bottom of the picture. The colored strips around the edge are the side stickers of the top layer. Arrows show where each piece needs to go. Hold the cube exactly as pictured, do the algorithm, and the case is solved; a "+ U" or "+ U'" label means finish with that turn.

&#91;image: All 21 PLL cases with arrows\]

Colors used: yellow top, green front, red right, blue back, orange left (standard color scheme).

| Name | Type | Algorithm |
| --- | --- | --- |
| Aa | Corners only | x R' U R' D2 R U' R' D2 R2 x' |
| Ab | Corners only | x R2 D2 R U R' D2 R U' R x' |
| E | Corners only | x' R U' R' D R U R' D' R U R' D R U' R' D' x |
| H | Edges only | M2 U M2 U2 M2 U M2 |
| Ua | Edges only | M2 U M U2 M' U M2 |
| Ub | Edges only | M2 U' M U2 M' U' M2 |
| Z | Edges only | M' U M2 U M2 U M' U2 M2 |
| T | Adjacent corner swap | R U R' U' R' F R2 U' R' U' R U R' F' |
| F | Adjacent corner swap | R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R |
| Ja | Adjacent corner swap | L' U' L F L' U' L U L F' L2 U L |
| Jb | Adjacent corner swap | R U R' F' R U R' U' R' F R2 U' R' |
| Ra | Adjacent corner swap | R U' R' U' R U R D R' U' R D' R' U2 R' |
| Rb | Adjacent corner swap | R2 F R U R U' R' F' R U2 R' U2 R |
| Ga | Adjacent corner swap | R2 U R' U R' U' R U' R2 U' D R' U R D' |
| Gb | Adjacent corner swap | R' U' R U D' R2 U R' U R U' R U' R2 D |
| Gc | Adjacent corner swap | R2 U' R U' R U R' U R2 U D' R U' R' D |
| Gd | Adjacent corner swap | R U R' U' D R2 U' R U' R' U R' U R2 D' |
| Y | Diagonal corner swap | F R U' R' U' R U R' F' R U R' U' R' F R F' |
| V | Diagonal corner swap | R' U R' U' y R' F' R2 U' R' U R' F R F |
| Na | Diagonal corner swap | R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R' |
| Nb | Diagonal corner swap | R' U R U' R' F' U' F R U R' F R' F' R U' R |

All 21 were checked with a cube simulator: each keeps the first two layers and the yellow top intact, and they solve 21 distinct cases. See jperm.net or speedcubedb.com for a picture of each case by name.

## Learning path

Learn in this order; each step is a big jump in speed without overwhelming your memory.

1. **Cross + intuitive F2L + 2-look OLL + 2-look PLL.** Only 15 algorithms. This gets most people under 1 minute, then toward 30 seconds.
2. **Full PLL (21).** PLL comes up every solve and is easy to recognize. Learn 2–3 per week.
3. **Full OLL (57).** Start with the groups you see most often, like the T, P, and L shapes.
4. **Advanced F2L.** Learn the remaining F2L cases, insert into back slots without rotating, and practice **lookahead**: while solving one pair, look for the next one.
5. **Inspection.** Use the full 15 seconds to plan the cross, then try to plan the first F2L pair too.

- [ ] Learn the notation until you can read an algorithm without looking twice
- [ ] Solve the cross on the bottom in 8 moves or fewer
- [ ] Learn 2-look OLL and 2-look PLL
- [ ] Learn all 21 PLLs
- [ ] Learn all 57 OLLs

Practice tips: drill new algorithms slowly until they're smooth, then speed them up. Use finger tricks (flicking U with your index finger) instead of whole-hand turns. Slow, steady solves with no pauses beat fast, jerky ones. A timer app like csTimer (cstimer.net) helps you track your average over time.
