/* ==========================================================================
   FE ARCADE — QUESTION BANK
   This is the ONLY file you edit to change the questions in all three games.
   ==========================================================================

   HOW TO ADD OR EDIT A QUESTION
   -----------------------------
   Copy one block, paste it, change the text. Rules:

     id     unique string. Convention: 3-letter topic prefix + number.
     topic  one of the keys in TOPICS below. Add new keys there first.
     exam   ["civil"], ["env"], or ["civil","env"].
     diff   1 = recall, 2 = one step, 3 = multi step. Drives points and timer colour.
     sec    seconds allowed when a game runs the question on a timer.
     q      the question stem, plain text.
     opts   exactly four options keyed A B C D.
     ans    the correct letter.
     why    short explanation shown after answering. This is where learning happens,
            so say WHY rather than repeating the answer.

   After saving, reload the page. All three games read from this one file.

   Check your edit before class:
       node tools/validate-questions.mjs

   Keep the file valid JavaScript: every block ends with a comma except the last,
   strings use double quotes, and a double quote inside a string is written \".

   Version: 2026-08-11   Questions: 133   Topics: 20
   ========================================================================== */

export const BANK = {
  version: "2026-08-11",
  source: "FE Civil and FE Environmental practice set, instructor authored for classroom pilot use. Not NCEES material.",

  /* Display names. Add a new topic here before using it below. */
  TOPICS: {
    math: "Mathematics",
    prob: "Probability & Statistics",
    ethics: "Ethics & Professional Practice",
    econ: "Engineering Economics",
    statics: "Statics",
    dynamics: "Dynamics",
    mechmat: "Mechanics of Materials",
    materials: "Materials",
    structural: "Structural Engineering",
    geotech: "Geotechnical Engineering",
    transport: "Transportation",
    survey: "Surveying",
    construct: "Construction",
    fluids: "Fluid Mechanics",
    hydraul: "Hydraulics & Water Resources",
    envsci: "Environmental Science & Chemistry",
    water: "Water & Wastewater",
    air: "Air Quality",
    waste: "Solid & Hazardous Waste",
    risk: "Risk & Remediation"
  },

  questions: [

    /* ---------- MATHEMATICS ---------- */
    {
      id: "MTH-01", topic: "math", exam: ["civil", "env"], diff: 1, sec: 15,
      q: "One newton of force is equivalent to which combination of SI base units?",
      opts: {
        A: "kg m/s",
        B: "kg m^2/s^2",
        C: "kg m/s^2",
        D: "kg/m s^2"
      },
      ans: "C",
      why: "Force equals mass times acceleration, so N = kg times m/s^2. Note that kg m^2/s^2 is the joule (energy) and kg/m s^2 is the pascal (pressure)."
    },
    {
      id: "MTH-02", topic: "math", exam: ["civil", "env"], diff: 1, sec: 15,
      q: "What is the derivative of f(x) = 3x^4 with respect to x?",
      opts: {
        A: "12x^3",
        B: "3x^3",
        C: "12x^4",
        D: "4x^3"
      },
      ans: "A",
      why: "The power rule multiplies by the exponent and then reduces the exponent by one: 3 times 4 gives 12, and x^4 becomes x^3."
    },
    {
      id: "MTH-03", topic: "math", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "Vector A = 3i + 4j and vector B = 2i - 5j. What is the dot product A dot B?",
      opts: {
        A: "26",
        B: "6",
        C: "-20",
        D: "-14"
      },
      ans: "D",
      why: "The dot product multiplies matching components and adds them: (3)(2) + (4)(-5) = 6 - 20 = -14. Losing the negative sign gives the common wrong answer of 26."
    },
    {
      id: "MTH-04", topic: "math", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "A 2 by 2 matrix has first row 4 and 3, and second row 2 and 5. What is its determinant?",
      opts: {
        A: "26",
        B: "14",
        C: "20",
        D: "6"
      },
      ans: "B",
      why: "For a 2 by 2 matrix the determinant is (a)(d) minus (b)(c) = (4)(5) - (3)(2) = 14. Adding instead of subtracting the cross term gives 26."
    },
    {
      id: "MTH-05", topic: "math", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "Evaluate the definite integral of 2x dx from x = 1 to x = 4.",
      opts: {
        A: "15",
        B: "8",
        C: "16",
        D: "30"
      },
      ans: "A",
      why: "The antiderivative of 2x is x^2, so the value is 4^2 minus 1^2 = 16 - 1 = 15. Forgetting to subtract the lower limit leaves 16."
    },
    {
      id: "MTH-06", topic: "math", exam: ["civil", "env"], diff: 3, sec: 40,
      q: "A quantity decays by dy/dt = -0.2y with y = 50 at t = 0. What is y at t = 10?",
      opts: {
        A: "41.0",
        B: "16.7",
        C: "6.8",
        D: "10.0"
      },
      ans: "C",
      why: "The solution is y = 50e^(-0.2t), so at t = 10 the exponent is -2 and y = 50(0.135) = 6.8. Using an exponent of -0.2 instead of -2 gives the trap answer 41."
    },

    /* ---------- PROBABILITY & STATISTICS ---------- */
    {
      id: "PRB-01", topic: "prob", exam: ["civil", "env"], diff: 1, sec: 20,
      q: "What is the median of the data set 4, 8, 15, 16, 23, 42?",
      opts: {
        A: "15",
        B: "15.5",
        C: "16",
        D: "18"
      },
      ans: "B",
      why: "With an even count the median is the average of the two middle values, (15 + 16)/2 = 15.5. The value 18 is the mean, which is pulled upward by the outlier 42."
    },
    {
      id: "PRB-02", topic: "prob", exam: ["civil", "env"], diff: 1, sec: 15,
      q: "For a normal distribution, about what percent of values fall within one standard deviation of the mean?",
      opts: {
        A: "50",
        B: "90",
        C: "95",
        D: "68"
      },
      ans: "D",
      why: "The empirical rule gives roughly 68 percent within one standard deviation, 95 percent within two, and 99.7 percent within three."
    },
    {
      id: "PRB-03", topic: "prob", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "How many different committees of 3 people can be formed from a group of 8 people?",
      opts: {
        A: "56",
        B: "24",
        C: "112",
        D: "336"
      },
      ans: "A",
      why: "Order does not matter, so use combinations: 8!/(3!5!) = 56. The answer 336 is the permutation count, which wrongly treats the same three people in a different order as a new committee."
    },
    {
      id: "PRB-04", topic: "prob", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "A simple linear regression gives a coefficient of determination R^2 of 0.81. What is the magnitude of the correlation coefficient r?",
      opts: {
        A: "0.66",
        B: "0.81",
        C: "0.90",
        D: "0.95"
      },
      ans: "C",
      why: "The correlation coefficient is the square root of R^2, so r = 0.90. Squaring 0.81 instead of taking the root gives the distractor 0.66."
    },
    {
      id: "PRB-05", topic: "prob", exam: ["civil", "env"], diff: 2, sec: 30,
      q: "Each concrete cylinder has a 0.9 probability of passing a strength test. For 3 independent cylinders, what is the probability that all 3 pass?",
      opts: {
        A: "0.999",
        B: "0.729",
        C: "0.900",
        D: "0.270"
      },
      ans: "B",
      why: "For independent events multiply the probabilities: 0.9^3 = 0.729. The value 0.999 is the chance that at least one passes, which is a different question."
    },
    {
      id: "PRB-06", topic: "prob", exam: ["civil", "env"], diff: 3, sec: 40,
      q: "Concrete strength is normally distributed with a mean of 4000 psi and a standard deviation of 400 psi. About what percent of cylinders test below 3600 psi?",
      opts: {
        A: "2.5",
        B: "32",
        C: "84",
        D: "16"
      },
      ans: "D",
      why: "The z score is (3600 - 4000)/400 = -1.0, and about 68 percent lies within one standard deviation, leaving 32 percent split between both tails, so one tail holds about 16 percent."
    },

    /* ---------- ETHICS & PROFESSIONAL PRACTICE ---------- */
    {
      id: "ETH-01", topic: "ethics", exam: ["civil", "env"], diff: 1, sec: 15,
      q: "Under the NSPE Code of Ethics, what is the first and highest obligation of an engineer?",
      opts: {
        A: "Hold paramount the safety, health, and welfare of the public",
        B: "Maximize profit for the client",
        C: "Protect the reputation of the employer",
        D: "Deliver the project under budget"
      },
      ans: "A",
      why: "The first fundamental canon places public safety, health, and welfare above duties to client or employer, so it governs whenever those duties conflict."
    },
    {
      id: "ETH-02", topic: "ethics", exam: ["civil", "env"], diff: 1, sec: 20,
      q: "A licensed Professional Engineer may seal and sign engineering drawings only when the work was",
      opts: {
        A: "checked by any licensed engineer in the firm",
        B: "produced using approved design software",
        C: "prepared by that engineer or under the responsible charge of that engineer",
        D: "approved by the client in writing"
      },
      ans: "C",
      why: "The seal certifies personal responsible charge over the work. Sealing plans prepared by others outside your direct control is called plan stamping and is an ethics and licensure violation."
    },
    {
      id: "ETH-03", topic: "ethics", exam: ["civil", "env"], diff: 1, sec: 20,
      q: "An engineer is asked to review a design produced by a company in which the engineer owns stock. What is the proper action?",
      opts: {
        A: "Decline all future work with that client",
        B: "Disclose the financial interest to the client before proceeding",
        C: "Proceed quietly since the review is technical",
        D: "Accept the work and donate the fee"
      },
      ans: "B",
      why: "The code requires full disclosure of any circumstance that could influence or appear to influence judgment. Disclosure lets the client decide, while silence creates a hidden conflict of interest."
    },
    {
      id: "ETH-04", topic: "ethics", exam: ["civil", "env"], diff: 1, sec: 20,
      q: "Which of the following is normally required for licensure as a Professional Engineer in the United States?",
      opts: {
        A: "An accredited degree only",
        B: "Passing the FE exam only",
        C: "Membership in a technical society",
        D: "Passing the FE and PE exams plus qualifying experience"
      },
      ans: "D",
      why: "Licensure typically combines education, passing the FE exam, several years of progressive experience under a PE, and passing the PE exam. Society membership is voluntary and never a legal requirement."
    },
    {
      id: "ETH-05", topic: "ethics", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "An engineer finds a design error that could endanger building occupants, but the client refuses to correct it. What does the code require the engineer to do?",
      opts: {
        A: "Resign quietly to avoid liability",
        B: "Document the concern in the file and continue",
        C: "Notify the client and then the proper authority",
        D: "Do nothing because the client owns the design"
      },
      ans: "C",
      why: "When a judgment affecting public safety is overruled, the engineer must inform the client and then notify the authority that can act. Silence or quiet resignation leaves the hazard in place."
    },
    {
      id: "ETH-06", topic: "ethics", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "A structural engineer is offered a wastewater treatment design project well outside their training. Under the code, the engineer may accept the project only if",
      opts: {
        A: "qualified associates handle the parts outside the competence of the engineer",
        B: "the fee is reduced to reflect the learning curve",
        C: "the client signs a waiver of liability",
        D: "the engineer holds a PE license in any discipline"
      },
      ans: "A",
      why: "Engineers must perform services only in areas of competence. A single license does not certify every discipline, so bringing in qualified specialists is what makes acceptance ethical."
    },

    /* ---------- ENGINEERING ECONOMICS ---------- */
    {
      id: "ECO-01", topic: "econ", exam: ["civil", "env"], diff: 1, sec: 15,
      q: "For a public project, a benefit cost ratio greater than 1.0 indicates that",
      opts: {
        A: "the project will finish ahead of schedule",
        B: "benefits exceed costs, so the project is economically justified",
        C: "costs exceed benefits and the project should be rejected",
        D: "the project has no salvage value"
      },
      ans: "B",
      why: "The ratio compares the present worth of benefits to the present worth of costs, so a value above 1.0 means each dollar spent returns more than a dollar of benefit."
    },
    {
      id: "ECO-02", topic: "econ", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "A machine costs 50,000 dollars and has a salvage value of 5,000 dollars after a 9 year life. What is the annual straight line depreciation?",
      opts: {
        A: "4,500 dollars",
        B: "5,556 dollars",
        C: "6,111 dollars",
        D: "5,000 dollars"
      },
      ans: "D",
      why: "Straight line depreciation is (cost minus salvage) divided by life = (50,000 - 5,000)/9 = 5,000 per year. Forgetting to subtract salvage gives 5,556."
    },
    {
      id: "ECO-03", topic: "econ", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "How much will 5,000 dollars grow to in 2 years at 8 percent compounded annually?",
      opts: {
        A: "5,832 dollars",
        B: "5,800 dollars",
        C: "6,000 dollars",
        D: "5,400 dollars"
      },
      ans: "A",
      why: "F = P(1+i)^n = 5,000(1.08)^2 = 5,832. Simple interest would give only 5,800, and the 32 dollar difference is the interest earned on the first year of interest."
    },
    {
      id: "ECO-04", topic: "econ", exam: ["civil", "env"], diff: 2, sec: 30,
      q: "A product sells for 20 dollars per unit with a variable cost of 12 dollars per unit and fixed costs of 40,000 dollars per year. What is the break even quantity?",
      opts: {
        A: "2,000 units",
        B: "3,333 units",
        C: "5,000 units",
        D: "12,500 units"
      },
      ans: "C",
      why: "Break even quantity is fixed cost divided by contribution margin, which is price minus variable cost: 40,000/(20 - 12) = 5,000 units. Dividing by price alone gives the wrong value 2,000."
    },
    {
      id: "ECO-05", topic: "econ", exam: ["civil", "env"], diff: 3, sec: 40,
      q: "What is the present worth of 1,000 dollars received at the end of each year for 5 years at an interest rate of 10 percent?",
      opts: {
        A: "5,000 dollars",
        B: "3,791 dollars",
        C: "6,105 dollars",
        D: "4,000 dollars"
      },
      ans: "B",
      why: "Using P = A times the uniform series present worth factor, P = 1,000(3.7908) = 3,791. The value 6,105 is the future worth of the same series, not its present worth."
    },
    {
      id: "ECO-06", topic: "econ", exam: ["civil", "env"], diff: 3, sec: 35,
      q: "A credit account charges 1 percent interest per month. What is the effective annual interest rate?",
      opts: {
        A: "12.00 percent",
        B: "12.55 percent",
        C: "13.00 percent",
        D: "12.68 percent"
      },
      ans: "D",
      why: "Effective annual rate is (1 + r/m)^m minus 1 = (1.01)^12 - 1 = 12.68 percent. The 12 percent figure is only the nominal rate and ignores monthly compounding."
    },

    /* ---------- STATICS ---------- */
    {
      id: "STA-01", topic: "statics", exam: ["civil"], diff: 1, sec: 15,
      q: "A structural member is a two force member in equilibrium. What must be true of the two forces acting on it?",
      opts: {
        A: "Equal, opposite, and along the line joining the two points",
        B: "Equal and opposite but perpendicular to the member",
        C: "Equal in magnitude and acting in the same direction",
        D: "Unequal, so that they form a couple"
      },
      ans: "A",
      why: "With only two forces and no other loading, moment equilibrium drives both forces onto the line connecting their points of application, so the member carries pure axial load and no bending."
    },
    {
      id: "STA-02", topic: "statics", exam: ["civil"], diff: 1, sec: 20,
      q: "Three members meet at an unloaded truss joint and two of them are collinear. What is the force in the third member?",
      opts: {
        A: "Equal to the force in the collinear members",
        B: "Always tension",
        C: "Always compression",
        D: "Zero"
      },
      ans: "D",
      why: "Summing forces perpendicular to the two collinear members leaves only the third member, so its force must be zero. These zero force members stabilize the geometry but carry no load for that load case."
    },
    {
      id: "STA-03", topic: "statics", exam: ["civil"], diff: 2, sec: 25,
      q: "A 200 mm by 200 mm square sits with its base on the x axis, and a 200 mm wide by 100 mm tall rectangle sits directly on top of it. How far above the base is the centroid of the combined area?",
      opts: {
        A: "100 mm",
        B: "125 mm",
        C: "150 mm",
        D: "175 mm"
      },
      ans: "C",
      why: "Take the area weighted average: (40000 times 100 plus 20000 times 250) divided by 60000 gives 150 mm. The heavier square pulls the combined centroid down toward its own centroid at 100 mm."
    },
    {
      id: "STA-04", topic: "statics", exam: ["civil"], diff: 2, sec: 25,
      q: "A 500 N block rests on a level floor with a coefficient of static friction of 0.30. What horizontal force is needed to just start it sliding?",
      opts: {
        A: "150 N",
        B: "350 N",
        C: "500 N",
        D: "1667 N"
      },
      ans: "A",
      why: "Impending sliding requires F equal to mu times the normal force, and here the normal force equals the 500 N weight, so F is 0.30 times 500. Dividing by mu instead of multiplying produces the 1667 N trap."
    },
    {
      id: "STA-05", topic: "statics", exam: ["civil"], diff: 2, sec: 30,
      q: "A horizontal cantilever 12 m long is fixed at A. Downward loads of 5 kN act 4 m from A and 3 kN act at the free end. What is the moment reaction at A?",
      opts: {
        A: "36 kN-m",
        B: "48 kN-m",
        C: "56 kN-m",
        D: "96 kN-m"
      },
      ans: "C",
      why: "Each load contributes force times its distance from the fixed end: 5 times 4 plus 3 times 12 equals 56 kN-m. The support must supply that moment, plus an 8 kN vertical force, to hold the beam."
    },
    {
      id: "STA-06", topic: "statics", exam: ["civil"], diff: 2, sec: 25,
      q: "A 30 N force acts along the positive x axis and a 40 N force acts along the positive y axis at the same point. What is the resultant?",
      opts: {
        A: "50 N at 36.9 degrees above the x axis",
        B: "70 N at 45 degrees above the x axis",
        C: "10 N at 53.1 degrees above the x axis",
        D: "50 N at 53.1 degrees above the x axis"
      },
      ans: "D",
      why: "Perpendicular components combine by the Pythagorean rule to 50 N, and the direction is the arctangent of 40 over 30, or 53.1 degrees. Adding the magnitudes to get 70 N ignores that force is a vector."
    },
    {
      id: "STA-07", topic: "statics", exam: ["civil"], diff: 3, sec: 40,
      q: "A truss spans 12 m on simple supports and carries a 24 kN downward load at midspan. The apex is 3 m above the horizontal bottom chord. What is the force in the bottom chord?",
      opts: {
        A: "12 kN compression",
        B: "24 kN tension",
        C: "26.8 kN compression",
        D: "48 kN tension"
      },
      ans: "B",
      why: "Each reaction is 12 kN by symmetry. Cutting the truss and taking moments about the apex gives 12 times 6 equal to the chord force times the 3 m depth, so the bottom chord carries 24 kN of tension."
    },

    /* ---------- DYNAMICS ---------- */
    {
      id: "DYN-01", topic: "dynamics", exam: ["civil"], diff: 1, sec: 15,
      q: "A car travels around a circular track at constant speed. Which statement about its acceleration is correct?",
      opts: {
        A: "The acceleration is zero because the speed is constant",
        B: "The acceleration points along the direction of travel",
        C: "The acceleration points toward the center of the circle",
        D: "The acceleration points away from the center of the circle"
      },
      ans: "C",
      why: "Velocity is a vector, so changing only its direction still counts as acceleration. That normal component equals v squared over r and always points toward the center of curvature."
    },
    {
      id: "DYN-02", topic: "dynamics", exam: ["civil"], diff: 1, sec: 15,
      q: "Which quantity has units equivalent to newton seconds?",
      opts: {
        A: "Impulse",
        B: "Work",
        C: "Power",
        D: "Moment of inertia"
      },
      ans: "A",
      why: "Impulse is force multiplied by time, and it equals the change in linear momentum, whose units of kg times m per s are identical to N times s. Work would instead be N times m."
    },
    {
      id: "DYN-03", topic: "dynamics", exam: ["civil"], diff: 2, sec: 25,
      q: "A vehicle traveling at 30 m/s decelerates uniformly at 3 m/s^2. What distance does it cover before stopping?",
      opts: {
        A: "75 m",
        B: "150 m",
        C: "300 m",
        D: "450 m"
      },
      ans: "B",
      why: "Use v squared equal to v0 squared minus 2as, so s equals 900 divided by 6, which is 150 m. Multiplying 30 m/s by the 10 s stopping time gives 300 m and wrongly assumes the speed never drops."
    },
    {
      id: "DYN-04", topic: "dynamics", exam: ["civil"], diff: 2, sec: 25,
      q: "A 50 kg crate on a level floor is pulled by a 200 N horizontal force. The kinetic friction coefficient is 0.20 and g is 9.81 m/s^2. What is the acceleration?",
      opts: {
        A: "4.00 m/s^2",
        B: "2.04 m/s^2",
        C: "0.41 m/s^2",
        D: "0.20 m/s^2"
      },
      ans: "B",
      why: "Friction is 0.20 times 50 times 9.81, or 98.1 N, leaving a net force of 101.9 N, and dividing by the 50 kg mass gives 2.04 m/s^2. Ignoring friction entirely produces the 4.00 answer."
    },
    {
      id: "DYN-05", topic: "dynamics", exam: ["civil"], diff: 2, sec: 30,
      q: "A 1200 kg car traveling at 20 m/s is braked to a stop. What is the magnitude of the work done by the braking force?",
      opts: {
        A: "12 kJ",
        B: "24 kJ",
        C: "120 kJ",
        D: "240 kJ"
      },
      ans: "D",
      why: "Work equals the change in kinetic energy, so it is one half times 1200 times 20 squared, or 240 kJ. Using mass times velocity gives momentum in N-s, not energy, and lands on the 24 kJ trap."
    },
    {
      id: "DYN-06", topic: "dynamics", exam: ["civil"], diff: 3, sec: 35,
      q: "An undamped 20 kg mass hangs on a spring with stiffness 5000 N/m. What is the natural frequency in hertz?",
      opts: {
        A: "2.52 Hz",
        B: "6.28 Hz",
        C: "15.8 Hz",
        D: "250 Hz"
      },
      ans: "A",
      why: "The natural circular frequency is the square root of k over m, which is 15.8 rad/s. Dividing by 2 pi converts that to 2.52 cycles per second, so quoting 15.8 confuses rad/s with hertz."
    },
    {
      id: "DYN-07", topic: "dynamics", exam: ["civil"], diff: 3, sec: 40,
      q: "A ball leaves level ground at 20 m/s and 30 degrees above horizontal. Using g equal to 9.81 m/s^2, what is the horizontal range?",
      opts: {
        A: "17.7 m",
        B: "20.4 m",
        C: "35.3 m",
        D: "40.8 m"
      },
      ans: "C",
      why: "Range on level ground is v squared times the sine of twice the launch angle, divided by g, so 400 times 0.866 divided by 9.81 gives 35.3 m. Dropping the sine term leaves the 40.8 m trap."
    },

    /* ---------- MECHANICS OF MATERIALS ---------- */
    {
      id: "MEC-01", topic: "mechmat", exam: ["civil"], diff: 1, sec: 15,
      q: "Which elastic property relates lateral strain to axial strain in a bar loaded in simple tension?",
      opts: {
        A: "Modulus of elasticity",
        B: "Shear modulus",
        C: "Bulk modulus",
        D: "Poisson ratio"
      },
      ans: "D",
      why: "Poisson ratio is the negative ratio of lateral strain to axial strain, near 0.3 for steel. The modulus of elasticity instead links stress to strain along the direction of loading."
    },
    {
      id: "MEC-02", topic: "mechmat", exam: ["civil"], diff: 1, sec: 20,
      q: "On a Mohr circle drawn for a plane stress state, what does the radius of the circle represent?",
      opts: {
        A: "The maximum in plane shear stress",
        B: "The average normal stress",
        C: "The sum of the two principal stresses",
        D: "The difference of the two principal stresses"
      },
      ans: "A",
      why: "The circle is centered at the average normal stress, so the top of the circle sits one radius above the axis and that height is the largest in plane shear stress. The principal stress difference is two radii."
    },
    {
      id: "MEC-03", topic: "mechmat", exam: ["civil"], diff: 2, sec: 25,
      q: "A steel rod 2 m long with a cross sectional area of 500 mm^2 carries a 50 kN tensile load. With E equal to 200 GPa, what is the elongation?",
      opts: {
        A: "0.5 mm",
        B: "1.0 mm",
        C: "2.0 mm",
        D: "5.0 mm"
      },
      ans: "B",
      why: "Elongation is PL over AE, so 50000 times 2000 divided by 500 times 200000 equals 1.0 mm. The stress is only 100 MPa, comfortably elastic, so Hooke law applies."
    },
    {
      id: "MEC-04", topic: "mechmat", exam: ["civil"], diff: 2, sec: 25,
      q: "A steel bar is held between rigid supports and heated 40 degrees C. With alpha equal to 12 x 10^-6 per degree C and E equal to 200 GPa, what stress develops?",
      opts: {
        A: "24 MPa compression",
        B: "48 MPa compression",
        C: "96 MPa tension",
        D: "96 MPa compression"
      },
      ans: "D",
      why: "Full restraint converts the free thermal strain alpha times delta T into stress, so sigma equals E times alpha times delta T, or 96 MPa. Heating a bar that cannot expand pushes it into compression."
    },
    {
      id: "MEC-05", topic: "mechmat", exam: ["civil"], diff: 2, sec: 30,
      q: "A solid circular shaft 50 mm in diameter carries a torque of 1.5 kN-m. What is the maximum shear stress?",
      opts: {
        A: "244 MPa",
        B: "122 MPa",
        C: "61.1 MPa",
        D: "30.6 MPa"
      },
      ans: "C",
      why: "For a solid shaft tau equals 16T divided by pi d cubed, so 24 x 10^6 divided by 392700 gives 61.1 MPa. Using the bending property pi d^4 over 64 instead of the polar J doubles the result."
    },
    {
      id: "MEC-06", topic: "mechmat", exam: ["civil"], diff: 3, sec: 40,
      q: "A pinned end steel column is 4 m long with I equal to 20 x 10^6 mm^4 and E equal to 200 GPa. What is the Euler buckling load?",
      opts: {
        A: "617 kN",
        B: "1230 kN",
        C: "2470 kN",
        D: "9870 kN"
      },
      ans: "C",
      why: "Euler load is pi squared times EI divided by the effective length squared, and pinned ends give an effective length equal to the full 4 m. Assuming a fixed free column instead doubles the length and cuts the load to 617 kN."
    },
    {
      id: "MEC-07", topic: "mechmat", exam: ["civil"], diff: 3, sec: 40,
      q: "A simply supported rectangular beam spans 6 m under a uniform load of 8 kN/m. The section is 150 mm wide by 300 mm deep. What is the maximum bending stress?",
      opts: {
        A: "16 MPa",
        B: "24 MPa",
        C: "32 MPa",
        D: "64 MPa"
      },
      ans: "A",
      why: "Bending stress is M divided by the section modulus S, and for a rectangle S = b h squared over 6. Using b h squared over 12 is the moment of inertia formula misremembered, which halves S and doubles the stress. Keep them apart: S = b h squared over 6, I = b h cubed over 12."
    },

    /* ---------- MATERIALS ---------- */
    {
      id: "MAT-01", topic: "materials", exam: ["civil"], diff: 1, sec: 20,
      q: "For a given cement and adequate consolidation, lowering the water to cement ratio of concrete has what effect?",
      opts: {
        A: "Increases compressive strength and lowers permeability",
        B: "Lowers strength but improves workability",
        C: "Has essentially no effect on strength",
        D: "Increases both workability and permeability"
      },
      ans: "A",
      why: "Water beyond what hydration needs leaves capillary pores in the hardened paste, so a leaner mix is denser, stronger, and less permeable. The cost is lower workability unless a water reducer is added."
    },
    {
      id: "MAT-02", topic: "materials", exam: ["civil"], diff: 1, sec: 20,
      q: "ASTM A992 steel, the usual grade for wide flange building shapes, has what specified minimum yield strength?",
      opts: {
        A: "36 ksi",
        B: "42 ksi",
        C: "50 ksi",
        D: "65 ksi"
      },
      ans: "C",
      why: "A992 is a 50 ksi yield grade with a 65 ksi minimum tensile strength, so 65 ksi is the ultimate value rather than the yield. The older 36 ksi A36 grade is now used mainly for plates and angles."
    },
    {
      id: "MAT-03", topic: "materials", exam: ["civil"], diff: 1, sec: 20,
      q: "What is the main purpose of curing freshly placed concrete?",
      opts: {
        A: "To drive off excess mixing water quickly",
        B: "To keep moisture and temperature favorable so hydration continues",
        C: "To raise the slump before the concrete sets",
        D: "To reduce the amount of cement needed in the mix"
      },
      ans: "B",
      why: "Cement gains strength by reacting with water, so if the surface dries out early the reaction stops and the near surface concrete stays weak, dusty, and permeable."
    },
    {
      id: "MAT-04", topic: "materials", exam: ["civil"], diff: 1, sec: 20,
      q: "Air entraining admixtures are added to concrete mainly to improve what?",
      opts: {
        A: "Compressive strength",
        B: "Resistance to freezing and thawing",
        C: "Modulus of elasticity",
        D: "Bond to reinforcing steel"
      },
      ans: "B",
      why: "The microscopic entrained bubbles give freezing water room to expand, which relieves internal pressure in the paste. Strength drops slightly because those voids reduce the solid cross section."
    },
    {
      id: "MAT-05", topic: "materials", exam: ["civil"], diff: 2, sec: 25,
      q: "Normal weight concrete has a compressive strength of 28 MPa. Using Ec equal to 4700 times the square root of fc in MPa, what is the modulus of elasticity?",
      opts: {
        A: "5.3 GPa",
        B: "18.8 GPa",
        C: "24.9 GPa",
        D: "132 GPa"
      },
      ans: "C",
      why: "The square root of 28 is about 5.29, and 4700 times that is roughly 24900 MPa, or 24.9 GPa. Skipping the square root gives 132 GPa, which would make concrete stiffer than steel."
    },
    {
      id: "MAT-06", topic: "materials", exam: ["civil", "env"], diff: 2, sec: 25,
      q: "Why does corrosion of embedded reinforcing steel damage a concrete member?",
      opts: {
        A: "The steel dissolves away with no effect on the surrounding concrete",
        B: "The concrete becomes more alkaline and shrinks away from the bar",
        C: "Chlorides react with the cement paste and stiffen it",
        D: "Rust occupies more volume than the steel, cracking and spalling the cover"
      },
      ans: "D",
      why: "Corrosion products can take up several times the volume of the parent steel, so they wedge the cover apart. The resulting cracks admit more chloride and oxygen, which accelerates the whole process."
    },
    {
      id: "MAT-07", topic: "materials", exam: ["civil"], diff: 2, sec: 30,
      q: "In a dense graded hot mix asphalt, what happens if the binder content is raised well above the optimum?",
      opts: {
        A: "Air voids increase and the mix becomes brittle",
        B: "Stability rises and rutting resistance improves",
        C: "The mix becomes much stiffer at high temperature",
        D: "Air voids drop and the mix becomes prone to rutting and bleeding"
      },
      ans: "D",
      why: "Extra binder fills the aggregate voids, so under traffic the aggregate skeleton floats in asphalt instead of locking together. The mix then shoves and ruts, and binder bleeds to the surface in hot weather."
    },

    /* ---------- STRUCTURAL ENGINEERING ---------- */
    {
      id: "STR-01", topic: "structural", exam: ["civil"], diff: 1, sec: 20,
      q: "For a loaded beam, the slope of the bending moment diagram at any point equals what?",
      opts: {
        A: "The load intensity at that point",
        B: "The shear force at that point",
        C: "The deflection at that point",
        D: "The slope of the elastic curve"
      },
      ans: "B",
      why: "The derivative of moment with respect to distance equals shear, and the derivative of shear equals the load intensity. That is why the maximum moment occurs where the shear diagram crosses zero."
    },
    {
      id: "STR-02", topic: "structural", exam: ["civil"], diff: 1, sec: 20,
      q: "Under ASCE 7 strength design, which basic combination applies for dead load D acting with live load L only?",
      opts: {
        A: "1.0D plus 1.0L",
        B: "1.4D plus 1.7L",
        C: "1.6D plus 1.2L",
        D: "1.2D plus 1.6L"
      },
      ans: "D",
      why: "Live load is far more variable than dead load, so it carries the larger factor. The 1.4D plus 1.7L pair is the superseded ACI combination that students often recall by mistake."
    },
    {
      id: "STR-03", topic: "structural", exam: ["civil"], diff: 2, sec: 30,
      q: "A beam rests on supports A and B that are 6 m apart, with a 3 m overhang past B. A 10 kN downward load acts at the free end. What is the reaction at A?",
      opts: {
        A: "5 kN downward",
        B: "5 kN upward",
        C: "10 kN upward",
        D: "15 kN upward"
      },
      ans: "A",
      why: "Taking moments about B, the 10 kN load acting 3 m outside the span must be balanced by A acting over the 6 m span, giving 5 kN that pulls down to prevent uplift. Support B then carries 15 kN upward."
    },
    {
      id: "STR-04", topic: "structural", exam: ["civil"], diff: 2, sec: 25,
      q: "A simply supported beam spans 10 m under a uniform load of 12 kN/m. What is the maximum bending moment?",
      opts: {
        A: "75 kN-m",
        B: "150 kN-m",
        C: "300 kN-m",
        D: "600 kN-m"
      },
      ans: "B",
      why: "For a uniform load on a simple span the peak moment is w L squared over 8, occurring at midspan where shear is zero. Using w L squared over 2, the cantilever result, gives the 600 kN-m trap."
    },
    {
      id: "STR-05", topic: "structural", exam: ["civil"], diff: 2, sec: 30,
      q: "Under ACI strength design, a reinforced concrete section is tension controlled when the net tensile strain in the extreme steel is at least what value?",
      opts: {
        A: "0.002",
        B: "0.003",
        C: "0.004",
        D: "0.005"
      },
      ans: "D",
      why: "At a strain of 0.005 the steel has yielded well before the concrete crushes, so the beam fails in a ductile way with visible warning. The 0.003 figure is the assumed crushing strain of concrete, not a steel limit."
    },
    {
      id: "STR-06", topic: "structural", exam: ["civil"], diff: 2, sec: 25,
      q: "A simply supported beam carries a uniform load. If the span doubles while load intensity, E, and I stay the same, the maximum deflection changes by what factor?",
      opts: {
        A: "16",
        B: "8",
        C: "4",
        D: "2"
      },
      ans: "A",
      why: "Midspan deflection is 5 w L to the fourth power divided by 384 EI, so deflection scales with the fourth power of span. Doubling L multiplies it by 2 to the fourth, or 16, which is why long spans are governed by serviceability."
    },
    {
      id: "STR-07", topic: "structural", exam: ["civil"], diff: 3, sec: 40,
      q: "A simply supported beam spans 12 m. Using the influence line for moment at midspan, what maximum moment does a single 40 kN wheel load produce there?",
      opts: {
        A: "40 kN-m",
        B: "80 kN-m",
        C: "120 kN-m",
        D: "480 kN-m"
      },
      ans: "C",
      why: "The influence line for midspan moment is a triangle whose peak ordinate is L over 4, here 3 m. Placing the wheel at that peak gives 40 times 3, or 120 kN-m, which matches P L over 4 for a central point load."
    },

    /* ---------- GEOTECHNICAL ENGINEERING ---------- */
    {
      id: "GEO-01", topic: "geotech", exam: ["civil"], diff: 1, sec: 15,
      q: "The plasticity index of a fine grained soil is defined as which difference?",
      opts: {
        A: "Liquid limit minus plastic limit",
        B: "Plastic limit minus shrinkage limit",
        C: "Liquid limit minus shrinkage limit",
        D: "Natural water content minus plastic limit"
      },
      ans: "A",
      why: "The plasticity index is the range of water content over which the soil behaves as a plastic solid. A high index flags an active clay that is likely to swell, shrink, and compress under load."
    },
    {
      id: "GEO-02", topic: "geotech", exam: ["civil"], diff: 1, sec: 20,
      q: "In the Unified Soil Classification System, what does the group symbol CH represent?",
      opts: {
        A: "Clean well graded gravel",
        B: "Silty sand",
        C: "Inorganic clay of high plasticity",
        D: "Organic silt of low plasticity"
      },
      ans: "C",
      why: "C stands for clay and H means high plasticity, which corresponds to a liquid limit of 50 or more. The companion symbol CL covers clays with a liquid limit below 50."
    },
    {
      id: "GEO-03", topic: "geotech", exam: ["civil"], diff: 2, sec: 25,
      q: "A sand deposit has the water table at the ground surface and a saturated unit weight of 20 kN/m^3. Using 9.81 kN/m^3 for water, what is the effective vertical stress at 5 m depth?",
      opts: {
        A: "49 kPa",
        B: "51 kPa",
        C: "100 kPa",
        D: "149 kPa"
      },
      ans: "B",
      why: "Total stress is 20 times 5, or 100 kPa, and pore water pressure is 9.81 times 5, or 49 kPa, so the effective stress is the 51 kPa difference. Only effective stress controls strength and settlement."
    },
    {
      id: "GEO-04", topic: "geotech", exam: ["civil"], diff: 2, sec: 25,
      q: "A soil has a porosity of 0.375. What is the void ratio?",
      opts: {
        A: "0.23",
        B: "0.27",
        C: "0.38",
        D: "0.60"
      },
      ans: "D",
      why: "Porosity is voids over total volume while void ratio is voids over solids, so e equals n divided by 1 minus n, giving 0.375 over 0.625. Reversing that to n over 1 plus n yields the 0.27 trap."
    },
    {
      id: "GEO-05", topic: "geotech", exam: ["civil"], diff: 2, sec: 25,
      q: "A direct shear test on dry sand gives a friction angle of 34 degrees with no cohesion. What is the shear strength on a plane where the effective normal stress is 150 kPa?",
      opts: {
        A: "222 kPa",
        B: "150 kPa",
        C: "101 kPa",
        D: "84 kPa"
      },
      ans: "C",
      why: "The Mohr Coulomb strength of a cohesionless soil is the effective normal stress times the tangent of phi, so 150 times 0.675 gives 101 kPa. Using the sine of phi instead of the tangent gives 84 kPa."
    },
    {
      id: "GEO-06", topic: "geotech", exam: ["civil"], diff: 3, sec: 40,
      q: "A smooth vertical wall retains 4 m of dry cohesionless backfill with unit weight 18 kN/m^3 and friction angle 30 degrees. What is the total Rankine active thrust per meter of wall?",
      opts: {
        A: "24 kN/m",
        B: "48 kN/m",
        C: "96 kN/m",
        D: "144 kN/m"
      },
      ans: "B",
      why: "For phi of 30 degrees the active coefficient is one third, and the thrust is one half times Ka times gamma times H squared, or 0.5 times 0.333 times 18 times 16. Omitting Ka entirely gives 144 kN/m."
    },
    {
      id: "GEO-07", topic: "geotech", exam: ["civil", "env"], diff: 3, sec: 40,
      q: "Water flows through a soil sample 100 mm long with area 2000 mm^2 under a head difference of 200 mm. If k is 5 x 10^-4 cm/s, what is the flow rate?",
      opts: {
        A: "0.02 cm^3/s",
        B: "0.04 cm^3/s",
        C: "0.20 cm^3/s",
        D: "0.40 cm^3/s"
      },
      ans: "A",
      why: "Darcy law gives q equal to k times i times A, where the gradient i is the 20 cm head divided by the 10 cm length, or 2, and the area is 20 cm^2. Using the head of 20 cm as the gradient inflates the answer tenfold."
    },

    /* ---------- TRANSPORTATION ---------- */
    {
      id: "TRN-01", topic: "transport", exam: ["civil"], diff: 1, sec: 15,
      q: "In the fundamental relationship of traffic flow, flow q is equal to which product?",
      opts: {
        A: "Density times space mean speed",
        B: "Density divided by speed",
        C: "Speed divided by density",
        D: "Headway times spacing"
      },
      ans: "A",
      why: "The relation q = k times v ties flow in vehicles per hour to density in vehicles per mile and space mean speed in miles per hour, so the units cancel correctly."
    },
    {
      id: "TRN-02", topic: "transport", exam: ["civil"], diff: 1, sec: 20,
      q: "What is the primary purpose of superelevation on a highway horizontal curve?",
      opts: {
        A: "To drain water off the pavement",
        B: "To reduce required pavement thickness",
        C: "To help counteract centrifugal force acting on vehicles",
        D: "To increase the length of the curve"
      },
      ans: "C",
      why: "Banking the roadway lets a component of the vehicle weight resist the outward force, so less side friction is needed and higher curve speeds become safe."
    },
    {
      id: "TRN-03", topic: "transport", exam: ["civil"], diff: 2, sec: 25,
      q: "A horizontal curve has a degree of curve of 4 degrees using the arc definition. What is the radius in feet?",
      opts: {
        A: "716",
        B: "1,432",
        C: "1,146",
        D: "5,730"
      },
      ans: "B",
      why: "By the arc definition R = 5,729.58/D = 5,729.58/4 = 1,432 ft. Radius and degree of curve are inversely related, so a flatter curve has a smaller degree."
    },
    {
      id: "TRN-04", topic: "transport", exam: ["civil"], diff: 2, sec: 25,
      q: "A car travels at 60 mi/h. Using a perception reaction time of 2.5 seconds, how far does it travel before braking begins?",
      opts: {
        A: "88 ft",
        B: "150 ft",
        C: "264 ft",
        D: "220 ft"
      },
      ans: "D",
      why: "At 60 mi/h the speed is 88 ft/s, so the reaction distance is 88 times 2.5 = 220 ft. This is only part of stopping sight distance, since braking distance must still be added."
    },
    {
      id: "TRN-05", topic: "transport", exam: ["civil"], diff: 2, sec: 25,
      q: "A signalized approach has a saturation flow rate of 1,800 veh/h and an effective green ratio g/C of 0.40. What is the approach capacity?",
      opts: {
        A: "720 veh/h",
        B: "450 veh/h",
        C: "1,080 veh/h",
        D: "1,800 veh/h"
      },
      ans: "A",
      why: "Capacity equals saturation flow times the green ratio: 1,800(0.40) = 720 veh/h. The approach can only discharge during its share of the cycle, not the whole hour."
    },
    {
      id: "TRN-06", topic: "transport", exam: ["civil"], diff: 3, sec: 45,
      q: "A 2 mile roadway segment with an AADT of 10,000 had 15 crashes in one year. What is the crash rate per 100 million vehicle miles?",
      opts: {
        A: "21",
        B: "411",
        C: "205",
        D: "2,055"
      },
      ans: "C",
      why: "Vehicle miles traveled equal 10,000 times 365 times 2 = 7.3 million, and 15 divided by 7.3 million times 100 million gives about 205. Leaving out the segment length doubles the answer."
    },

    /* ---------- SURVEYING ---------- */
    {
      id: "SUR-01", topic: "survey", exam: ["civil"], diff: 1, sec: 20,
      q: "In differential leveling, the height of instrument is computed as",
      opts: {
        A: "benchmark elevation minus the backsight",
        B: "foresight plus backsight",
        C: "benchmark elevation minus the foresight",
        D: "benchmark elevation plus the backsight"
      },
      ans: "D",
      why: "A backsight is read on a point of known elevation, so adding it gives the elevation of the line of sight. Foresights are then subtracted from that height to get new point elevations."
    },
    {
      id: "SUR-02", topic: "survey", exam: ["civil"], diff: 2, sec: 25,
      q: "A line has a bearing of S 30 degrees W. What is its azimuth measured clockwise from north?",
      opts: {
        A: "150 degrees",
        B: "210 degrees",
        C: "240 degrees",
        D: "330 degrees"
      },
      ans: "B",
      why: "Southwest bearings convert with azimuth = 180 plus the bearing angle, giving 210 degrees. A bearing of S 30 E would instead give 150 degrees."
    },
    {
      id: "SUR-03", topic: "survey", exam: ["civil"], diff: 2, sec: 30,
      q: "A benchmark at elevation 100.00 ft is backsighted at 4.25 ft, then a foresight of 6.50 ft is read on a turning point. What is the turning point elevation?",
      opts: {
        A: "97.75 ft",
        B: "102.25 ft",
        C: "110.75 ft",
        D: "95.75 ft"
      },
      ans: "A",
      why: "Height of instrument is 100.00 + 4.25 = 104.25 ft, and 104.25 - 6.50 = 97.75 ft. A larger foresight than backsight always means the new point is lower."
    },
    {
      id: "SUR-04", topic: "survey", exam: ["civil"], diff: 2, sec: 25,
      q: "What is the theoretical sum of the interior angles of a closed five sided traverse?",
      opts: {
        A: "360 degrees",
        B: "900 degrees",
        C: "540 degrees",
        D: "720 degrees"
      },
      ans: "C",
      why: "Interior angles sum to (n - 2) times 180, so five sides give 540 degrees. Comparing the field sum to this value gives the angular misclosure to be distributed."
    },
    {
      id: "SUR-05", topic: "survey", exam: ["civil"], diff: 3, sec: 40,
      q: "Two cross sections 100 ft apart have end areas of 120 ft^2 and 180 ft^2. Using the average end area method, what is the volume in cubic yards?",
      opts: {
        A: "15,000",
        B: "1,667",
        C: "278",
        D: "556"
      },
      ans: "D",
      why: "Average the areas and multiply by distance: (120 + 180)/2 times 100 = 15,000 ft^3, then divide by 27 to get 556 yd^3. Forgetting the 27 conversion is the most common error."
    },
    {
      id: "SUR-06", topic: "survey", exam: ["civil"], diff: 3, sec: 40,
      q: "A horizontal curve has a radius of 500 ft and a central angle of 60 degrees. What is the length of the curve?",
      opts: {
        A: "261.8 ft",
        B: "523.6 ft",
        C: "288.7 ft",
        D: "500.0 ft"
      },
      ans: "B",
      why: "Curve length is R times the central angle in radians: 500 times 1.047 = 523.6 ft. The value 288.7 ft is the tangent distance R tan of half the central angle."
    },

    /* ---------- CONSTRUCTION ---------- */
    {
      id: "CON-01", topic: "construct", exam: ["civil"], diff: 1, sec: 15,
      q: "On a CPM network, the critical path is best described as",
      opts: {
        A: "the longest path through the network, with zero total float",
        B: "the shortest path through the network",
        C: "the path containing the most activities",
        D: "the path with the highest cost"
      },
      ans: "A",
      why: "The longest path sets the minimum project duration, so its activities have no float and any delay on it delays the entire project."
    },
    {
      id: "CON-02", topic: "construct", exam: ["civil"], diff: 1, sec: 20,
      q: "Under OSHA excavation rules, a protective system such as sloping, shoring, or shielding is generally required when the excavation depth reaches",
      opts: {
        A: "3 ft (0.9 m)",
        B: "10 ft (3.0 m)",
        C: "20 ft (6.1 m)",
        D: "5 ft (1.5 m)"
      },
      ans: "D",
      why: "OSHA requires protection at 5 ft or deeper unless the excavation is in stable rock, and at 20 ft or deeper the system must be designed by a registered professional engineer."
    },
    {
      id: "CON-03", topic: "construct", exam: ["civil"], diff: 2, sec: 25,
      q: "An activity has early start day 10, early finish day 14, late start day 16, and late finish day 20. What is its total float?",
      opts: {
        A: "0 days",
        B: "2 days",
        C: "6 days",
        D: "4 days"
      },
      ans: "C",
      why: "Total float equals late start minus early start, or late finish minus early finish, and both give 6 days. The 4 day figure is the activity duration, not its float."
    },
    {
      id: "CON-04", topic: "construct", exam: ["civil"], diff: 2, sec: 30,
      q: "A scraper moves 20 bank cubic yards per cycle with a 5 minute cycle time and works an effective 50 minutes per hour. What is the hourly production?",
      opts: {
        A: "100 BCY/h",
        B: "200 BCY/h",
        C: "240 BCY/h",
        D: "400 BCY/h"
      },
      ans: "B",
      why: "The machine completes 50/5 = 10 cycles per hour, so production is 10 times 20 = 200 BCY/h. Using a full 60 minute hour ignores the efficiency factor and overstates output as 240."
    },
    {
      id: "CON-05", topic: "construct", exam: ["civil"], diff: 2, sec: 25,
      q: "Under a design build project delivery method, the owner holds",
      opts: {
        A: "one contract with a single entity responsible for both design and construction",
        B: "separate contracts with the designer and the contractor",
        C: "no contract until construction begins",
        D: "a contract only with the subcontractors"
      },
      ans: "A",
      why: "A single point of responsibility removes the gap between designer and builder, which usually shortens schedules but gives the owner less direct control over design details."
    },
    {
      id: "CON-06", topic: "construct", exam: ["civil"], diff: 3, sec: 40,
      q: "A project reports planned value 120,000 dollars, earned value 100,000 dollars, and actual cost 110,000 dollars. What are the cost variance and schedule variance?",
      opts: {
        A: "CV = +10,000 and SV = +20,000",
        B: "CV = -20,000 and SV = -10,000",
        C: "CV = -10,000 and SV = +20,000",
        D: "CV = -10,000 and SV = -20,000"
      },
      ans: "D",
      why: "Cost variance is earned value minus actual cost: 100,000 - 110,000 = -10,000. Schedule variance is earned value minus planned value: 100,000 - 120,000 = -20,000. Both negative means over budget and behind schedule. Swapping the two formulas gives the reversed pair, which is the trap."
    },

    /* ---------- FLUID MECHANICS ---------- */
    {
      id: "FLU-01", topic: "fluids", exam: ["env", "civil"], diff: 1, sec: 15,
      q: "A solid object is fully submerged in water. The buoyant force acting on it equals which quantity?",
      opts: {
        A: "The weight of the object",
        B: "The volume of fluid displaced",
        C: "The weight of the fluid displaced",
        D: "The density of the fluid"
      },
      ans: "C",
      why: "Archimedes principle says buoyant force equals the weight of the displaced fluid, so it depends on fluid density and displaced volume, not on how heavy the object itself is."
    },
    {
      id: "FLU-02", topic: "fluids", exam: ["env", "civil"], diff: 1, sec: 20,
      q: "A centrifugal pump avoids cavitation when which condition is satisfied on the suction side?",
      opts: {
        A: "NPSH available is greater than NPSH required",
        B: "NPSH required is greater than NPSH available",
        C: "Suction pressure equals the vapor pressure",
        D: "Discharge head equals the static head"
      },
      ans: "A",
      why: "Cavitation starts when local pressure falls to the vapor pressure and bubbles form and then collapse. Keeping available net positive suction head above the pump requirement keeps the liquid safely above vapor pressure."
    },
    {
      id: "FLU-03", topic: "fluids", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "What is the gauge pressure at a depth of 10 m in water? Use density 1000 kg/m3 and g = 9.81 m/s2.",
      opts: {
        A: "9.81 kPa",
        B: "98.1 kPa",
        C: "981 kPa",
        D: "101 kPa"
      },
      ans: "B",
      why: "Hydrostatic pressure is density times g times depth: 1000 x 9.81 x 10 = 98,100 Pa. Roughly 10 m of water equals about one atmosphere, which is a fast sanity check."
    },
    {
      id: "FLU-04", topic: "fluids", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "Water flows at 2 m/s in a 300 mm diameter pipe that reduces to a 150 mm diameter pipe. What is the velocity in the smaller pipe?",
      opts: {
        A: "1 m/s",
        B: "4 m/s",
        C: "16 m/s",
        D: "8 m/s"
      },
      ans: "D",
      why: "Continuity requires A1V1 = A2V2, and area scales with diameter squared. Halving the diameter cuts area to one quarter, so velocity must rise by a factor of four."
    },
    {
      id: "FLU-05", topic: "fluids", exam: ["env", "civil"], diff: 2, sec: 30,
      q: "Water with kinematic viscosity 1.0 x 10^-6 m2/s flows at 1.5 m/s in a 50 mm pipe. What is the Reynolds number and flow regime?",
      opts: {
        A: "7,500 and turbulent",
        B: "75,000 and laminar",
        C: "75,000 and turbulent",
        D: "750 and laminar"
      },
      ans: "C",
      why: "Re = VD divided by kinematic viscosity = 1.5 x 0.05 / 1.0 x 10^-6 = 75,000. Pipe flow above about 4,000 is fully turbulent and below about 2,100 is laminar."
    },
    {
      id: "FLU-06", topic: "fluids", exam: ["env", "civil"], diff: 3, sec: 40,
      q: "Find the head loss in a 500 m long pipe of 0.2 m diameter carrying water at 2 m/s with friction factor 0.02. Use Darcy-Weisbach and g = 9.81 m/s2.",
      opts: {
        A: "10.2 m",
        B: "20.4 m",
        C: "5.1 m",
        D: "2.0 m"
      },
      ans: "A",
      why: "hf = f (L/D)(V^2 / 2g) = 0.02 x 2,500 x 0.204 = 10.2 m. Dropping the factor of 2 in the velocity head doubles the answer and is the most common slip here."
    },
    {
      id: "FLU-07", topic: "fluids", exam: ["env", "civil"], diff: 3, sec: 40,
      q: "A pump delivers 0.05 m3/s of water against a total dynamic head of 20 m at 80 percent efficiency. What input power is required?",
      opts: {
        A: "7.85 kW",
        B: "9.81 kW",
        C: "15.7 kW",
        D: "12.3 kW"
      },
      ans: "D",
      why: "Water power is rho x g x Q x H = 1000 x 9.81 x 0.05 x 20 = 9.81 kW. Input power is water power divided by efficiency: 9.81 / 0.80 = 12.3 kW. Dividing by efficiency always raises the required input, so 7.85 kW (multiplying instead) and 9.81 kW (ignoring efficiency) are both traps."
    },

    /* ---------- HYDRAULICS & WATER RESOURCES ---------- */
    {
      id: "HYD-01", topic: "hydraul", exam: ["env", "civil"], diff: 1, sec: 20,
      q: "For a sharp crested rectangular weir, discharge is proportional to the head above the crest raised to what power?",
      opts: {
        A: "1/2",
        B: "3/2",
        C: "1",
        D: "5/2"
      },
      ans: "B",
      why: "Rectangular weir flow varies as head to the 3/2 power, while a triangular V notch weir varies as head to the 5/2 power. That sharper sensitivity is why V notches measure small flows accurately."
    },
    {
      id: "HYD-02", topic: "hydraul", exam: ["env", "civil"], diff: 1, sec: 15,
      q: "A hydraulic jump in an open channel forms when the flow changes from which state to which state?",
      opts: {
        A: "Subcritical to supercritical",
        B: "Laminar to turbulent",
        C: "Supercritical to subcritical",
        D: "Turbulent to laminar"
      },
      ans: "C",
      why: "A jump converts fast shallow supercritical flow with Froude number above 1 into slower deeper subcritical flow while dissipating energy. That energy loss is exactly why jumps are built into stilling basins."
    },
    {
      id: "HYD-03", topic: "hydraul", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "Use the rational method to find peak runoff from a 10 acre site with runoff coefficient 0.6 during a storm of intensity 2 in/hr.",
      opts: {
        A: "12 cfs",
        B: "3.3 cfs",
        C: "20 cfs",
        D: "33 cfs"
      },
      ans: "A",
      why: "Q = CiA = 0.6 x 2 x 10 = 12 cfs. The arithmetic is direct in US units because 1 in/hr falling on 1 acre is almost exactly 1 cfs, so no conversion factor is needed."
    },
    {
      id: "HYD-04", topic: "hydraul", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "An aquifer has hydraulic conductivity 0.5 m/day and a hydraulic gradient of 0.02. What flow passes through a cross section of 100 m2?",
      opts: {
        A: "0.01 m3/day",
        B: "0.1 m3/day",
        C: "10 m3/day",
        D: "1.0 m3/day"
      },
      ans: "D",
      why: "Darcy law gives Q = KiA = 0.5 x 0.02 x 100 = 1 m3/day. The product Ki alone is the Darcy or superficial velocity, which must still be divided by porosity to get real pore water velocity."
    },
    {
      id: "HYD-05", topic: "hydraul", exam: ["env", "civil"], diff: 2, sec: 30,
      q: "A rectangular channel 3 m wide flows 1 m deep with Manning n = 0.013 and slope 0.001. What is the average velocity?",
      opts: {
        A: "1.15 m/s",
        B: "1.73 m/s",
        C: "2.43 m/s",
        D: "5.19 m/s"
      },
      ans: "B",
      why: "Hydraulic radius R = A/P = 3/(3 + 2) = 0.6 m, so V = (1/0.013)(0.6^0.667)(0.001^0.5) = 1.73 m/s. Using depth in place of hydraulic radius gives 2.43, and 5.19 is the discharge rather than velocity."
    },
    {
      id: "HYD-06", topic: "hydraul", exam: ["env", "civil"], diff: 3, sec: 40,
      q: "A rectangular channel 4 m wide carries 12 m3/s. What is the critical depth? Use g = 9.81 m/s2.",
      opts: {
        A: "0.61 m",
        B: "3.00 m",
        C: "0.97 m",
        D: "1.46 m"
      },
      ans: "C",
      why: "Unit discharge q = 12/4 = 3 m2/s, and critical depth is the cube root of q squared over g, the cube root of 0.917, which is 0.97 m. The value 1.46 m is minimum specific energy, equal to 1.5 times critical depth."
    },
    {
      id: "HYD-07", topic: "hydraul", exam: ["env", "civil"], diff: 3, sec: 40,
      q: "A 2 hour unit hydrograph peaks at 40 m3/s. If 3 cm of excess rainfall falls in 2 hours and baseflow is 5 m3/s, what is the peak discharge?",
      opts: {
        A: "125 m3/s",
        B: "120 m3/s",
        C: "45 m3/s",
        D: "135 m3/s"
      },
      ans: "A",
      why: "A unit hydrograph is the response to 1 cm of excess rainfall, so the ordinates scale linearly: 3 x 40 = 120 m3/s of direct runoff. Baseflow is not part of the unit response, so it is added last, giving 120 + 5 = 125 m3/s. Stopping at 120 is the trap."
    },

    /* ---------- ENVIRONMENTAL SCIENCE & CHEMISTRY ---------- */
    {
      id: "ENV-01", topic: "envsci", exam: ["env", "civil"], diff: 1, sec: 15,
      q: "For the same wastewater sample, how does chemical oxygen demand normally compare with the 5 day biochemical oxygen demand?",
      opts: {
        A: "About half of the BOD",
        B: "Equal to the BOD",
        C: "Lower than the BOD",
        D: "Higher than the BOD"
      },
      ans: "D",
      why: "COD uses a strong chemical oxidant that attacks both biodegradable and nonbiodegradable organics, while BOD5 counts only what microbes consume in 5 days. COD is therefore larger and available in hours instead of days."
    },
    {
      id: "ENV-02", topic: "envsci", exam: ["env", "civil"], diff: 1, sec: 20,
      q: "Henry law states that the equilibrium concentration of a dissolved gas in water is proportional to what?",
      opts: {
        A: "The pH of the water",
        B: "The partial pressure of that gas above the water",
        C: "The ionic strength of the water",
        D: "The mass of dissolved solids present"
      },
      ans: "B",
      why: "Dissolved gas concentration tracks the partial pressure of that gas in the air above the liquid. This is why dissolved oxygen falls at high temperature or altitude, and why air stripping removes volatile compounds."
    },
    {
      id: "ENV-03", topic: "envsci", exam: ["env", "civil"], diff: 1, sec: 15,
      q: "Free chlorine in water exists as hypochlorous acid and hypochlorite ion. Which of the two is the stronger disinfectant?",
      opts: {
        A: "Hypochlorous acid HOCl",
        B: "Hypochlorite ion OCl-",
        C: "Both are equally effective",
        D: "Chloride ion Cl-"
      },
      ans: "A",
      why: "The neutral HOCl molecule penetrates cell walls far better than the charged OCl- ion and is roughly 80 times more effective. HOCl dominates below about pH 7.5, so disinfection weakens as pH climbs."
    },
    {
      id: "ENV-04", topic: "envsci", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "A contaminant degrades by first order kinetics with rate constant k = 0.0347 per day. What is its half life?",
      opts: {
        A: "10 days",
        B: "14 days",
        C: "20 days",
        D: "29 days"
      },
      ans: "C",
      why: "Half life equals ln(2)/k = 0.693/0.0347, which is about 20 days. In first order decay the half life depends only on k, never on the starting concentration."
    },
    {
      id: "ENV-05", topic: "envsci", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "A stream flowing at 8 m3/s with 2 mg/L chloride receives a discharge of 2 m3/s containing 22 mg/L. What is the completely mixed concentration?",
      opts: {
        A: "4.0 mg/L",
        B: "6.0 mg/L",
        C: "12.0 mg/L",
        D: "24.0 mg/L"
      },
      ans: "B",
      why: "Conserve mass across the junction: (8 x 2 + 2 x 22) / (8 + 2) = 60/10 = 6.0 mg/L. Averaging the two concentrations without weighting by flow gives 12 mg/L and is the classic error."
    },
    {
      id: "ENV-06", topic: "envsci", exam: ["env", "civil"], diff: 2, sec: 30,
      q: "How many grams of sodium hydroxide, molecular weight 40 g/mol, are needed to prepare 2.0 L of a 0.25 M solution?",
      opts: {
        A: "5 g",
        B: "10 g",
        C: "80 g",
        D: "20 g"
      },
      ans: "D",
      why: "Moles = molarity x volume = 0.25 x 2.0 = 0.5 mol, and 0.5 mol x 40 g/mol = 20 g. For NaOH the normality equals the molarity because each mole supplies one equivalent."
    },
    {
      id: "ENV-07", topic: "envsci", exam: ["env", "civil"], diff: 3, sec: 40,
      q: "A water contains 40 mg/L of calcium, atomic weight 40, and 12 mg/L of magnesium, atomic weight 24. What is the total hardness as CaCO3?",
      opts: {
        A: "150 mg/L",
        B: "52 mg/L",
        C: "100 mg/L",
        D: "260 mg/L"
      },
      ans: "A",
      why: "Convert each ion to equivalents: calcium is 40/20 = 2 meq/L and magnesium is 12/12 = 1 meq/L, and each meq/L equals 50 mg/L as CaCO3, giving 150. Both ions are divalent, so equivalent weight is the atomic weight divided by 2."
    },

    /* ---------- WATER & WASTEWATER ---------- */
    {
      id: "WAT-01", topic: "water", exam: ["env", "civil"], diff: 1, sec: 15,
      q: "Which chemical is the coagulant most commonly used in conventional surface water treatment?",
      opts: {
        A: "Sodium hypochlorite",
        B: "Powdered activated carbon",
        C: "Aluminum sulfate",
        D: "Sodium bicarbonate"
      },
      ans: "C",
      why: "Alum supplies trivalent aluminum that neutralizes the negative surface charge on colloids so particles can collide and grow into settleable floc. It also consumes alkalinity, which sometimes has to be replaced."
    },
    {
      id: "WAT-02", topic: "water", exam: ["env", "civil"], diff: 1, sec: 20,
      q: "Which membrane process is required to remove dissolved salts such as sodium chloride from water?",
      opts: {
        A: "Microfiltration",
        B: "Ultrafiltration",
        C: "Nanofiltration",
        D: "Reverse osmosis"
      },
      ans: "D",
      why: "Effective pore size shrinks going from microfiltration toward reverse osmosis. Only reverse osmosis rejects small monovalent ions, while nanofiltration mainly removes divalent hardness ions and larger organics."
    },
    {
      id: "WAT-03", topic: "water", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "A rectangular sedimentation basin is 30 m long, 10 m wide and 3 m deep and treats 9000 m3/day. What is the theoretical detention time?",
      opts: {
        A: "1.2 hours",
        B: "2.4 hours",
        C: "4.8 hours",
        D: "10 hours"
      },
      ans: "B",
      why: "Detention time is volume divided by flow: 900 m3 / 9000 m3 per day = 0.1 day, or 2.4 hours. Detention time uses the full basin volume, while overflow rate uses only the surface area."
    },
    {
      id: "WAT-04", topic: "water", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "An aeration tank of 2000 m3 holds 2500 mg/L MLVSS and receives 5000 m3/day at 200 mg/L BOD. What is the F/M ratio?",
      opts: {
        A: "0.20 per day",
        B: "0.10 per day",
        C: "0.40 per day",
        D: "2.0 per day"
      },
      ans: "A",
      why: "F/M = (Q x BOD) / (V x MLVSS) = (5000 x 200) / (2000 x 2500) = 0.20 per day. Conventional activated sludge runs near 0.2 to 0.4, and lower values push the plant toward extended aeration."
    },
    {
      id: "WAT-05", topic: "water", exam: ["env", "civil"], diff: 2, sec: 25,
      q: "A plant treats 10,000 m3/day and applies a chlorine dose of 2.5 mg/L. How much chlorine is consumed per day?",
      opts: {
        A: "2.5 kg/day",
        B: "250 kg/day",
        C: "25 kg/day",
        D: "2500 kg/day"
      },
      ans: "C",
      why: "Mass equals flow times concentration, and 1 mg/L is the same as 1 g/m3, so 10,000 x 2.5 = 25,000 g = 25 kg per day. Remembering that mg/L equals g/m3 turns SI dosing problems into one step."
    },
    {
      id: "WAT-06", topic: "water", exam: ["env", "civil"], diff: 2, sec: 30,
      q: "A chlorine contact basin provides 30 minutes of contact with a free chlorine residual of 1.5 mg/L. What is the CT value?",
      opts: {
        A: "20 mg-min/L",
        B: "0.75 mg-min/L",
        C: "90 mg-min/L",
        D: "45 mg-min/L"
      },
      ans: "D",
      why: "CT is the residual concentration multiplied by contact time: 1.5 x 30 = 45 mg-min/L. Required CT rises in colder water and at higher pH, and each organism such as Giardia has its own CT table."
    },
    {
      id: "WAT-07", topic: "water", exam: ["env", "civil"], diff: 3, sec: 40,
      q: "An aeration tank of 4000 m3 holds 3000 mg/L MLSS. Waste sludge leaves at 80 m3/day with 10,000 mg/L solids. Ignoring effluent solids, what is the solids retention time?",
      opts: {
        A: "5 days",
        B: "15 days",
        C: "10 days",
        D: "30 days"
      },
      ans: "B",
      why: "SRT is solids held in the system divided by solids wasted per day: (4000 x 3000) / (80 x 10,000) = 15 days. Wasting more sludge shortens SRT, which favors fast growing organisms and can wash out slow nitrifiers."
    },

    /* ---------- AIR QUALITY ---------- */
    {
      id: "AIR-01", topic: "air", exam: ["env"], diff: 1, sec: 15,
      q: "Which of these is NOT one of the six criteria pollutants regulated under the NAAQS?",
      opts: {
        A: "Ozone",
        B: "Carbon dioxide",
        C: "Lead",
        D: "Sulfur dioxide"
      },
      ans: "B",
      why: "The six criteria pollutants are ozone, particulate matter, carbon monoxide, nitrogen dioxide, sulfur dioxide and lead. Carbon dioxide is regulated as a greenhouse gas rather than under health based ambient standards."
    },
    {
      id: "AIR-02", topic: "air", exam: ["env"], diff: 1, sec: 15,
      q: "PM2.5 refers to particulate matter with what aerodynamic diameter?",
      opts: {
        A: "2.5 micrometers or smaller",
        B: "Exactly 2.5 micrometers",
        C: "Between 2.5 and 10 micrometers",
        D: "2.5 millimeters or smaller"
      },
      ans: "A",
      why: "PM2.5 includes everything at or below 2.5 micrometers, so it is a subset of PM10. Fine particles travel deep into the alveoli, which is why they carry more health risk than coarse dust."
    },
    {
      id: "AIR-03", topic: "air", exam: ["env"], diff: 1, sec: 20,
      q: "How is ground level ozone primarily formed?",
      opts: {
        A: "Direct emission from vehicle tailpipes",
        B: "Oxidation of sulfur dioxide inside clouds",
        C: "Photochemical reaction of nitrogen oxides and VOCs in sunlight",
        D: "Evaporation of refrigerants"
      },
      ans: "C",
      why: "Ozone is a secondary pollutant formed when sunlight drives reactions between NOx and volatile organic compounds. That is why ozone peaks on hot sunny afternoons and often downwind of the city rather than at the source."
    },
    {
      id: "AIR-04", topic: "air", exam: ["env"], diff: 2, sec: 25,
      q: "A baghouse reduces particulate loading from 5.0 g/m3 to 0.05 g/m3. What is its collection efficiency?",
      opts: {
        A: "90 percent",
        B: "95 percent",
        C: "99.9 percent",
        D: "99 percent"
      },
      ans: "D",
      why: "Efficiency is inlet minus outlet divided by inlet: (5.0 - 0.05)/5.0 = 0.99. Fabric filters reach this range even on fine particles, which is something cyclones cannot do."
    },
    {
      id: "AIR-05", topic: "air", exam: ["env"], diff: 2, sec: 30,
      q: "Convert 1.0 ppm by volume of sulfur dioxide, molecular weight 64, to mg/m3 at 25 C and 1 atm where molar volume is 24.45 L/mol.",
      opts: {
        A: "0.38 mg/m3",
        B: "6.40 mg/m3",
        C: "2.62 mg/m3",
        D: "1.00 mg/m3"
      },
      ans: "C",
      why: "mg/m3 = ppm x molecular weight / 24.45 = 64/24.45 = 2.62. The molar volume comes from the ideal gas law, so it shifts with temperature and pressure and must be recalculated for other conditions."
    },
    {
      id: "AIR-06", topic: "air", exam: ["env"], diff: 2, sec: 25,
      q: "A boiler burns 200 tonnes of coal per year and the sulfur dioxide emission factor is 19 kg per tonne of coal. What is the annual SO2 emission?",
      opts: {
        A: "1,900 kg",
        B: "3,800 kg",
        C: "380 kg",
        D: "38,000 kg"
      },
      ans: "B",
      why: "Emissions equal activity rate times emission factor: 200 x 19 = 3,800 kg per year. Sulfur dioxide is the main precursor of acid rain, so these factors drive both permit limits and control choices."
    },
    {
      id: "AIR-07", topic: "air", exam: ["env"], diff: 3, sec: 45,
      q: "Peak ground level concentration varies inversely with effective stack height squared. For a 50 m stack, plume rise increases from 30 m to 60 m. What factor multiplies the peak concentration?",
      opts: {
        A: "0.53",
        B: "0.73",
        C: "1.38",
        D: "1.89"
      },
      ans: "A",
      why: "Effective height rises from 80 m to 110 m, so the ratio is (80/110) squared, which is 0.53, a 47 percent reduction. Because the relationship is squared, modest gains in plume rise pay off strongly."
    },

    /* ---------- SOLID & HAZARDOUS WASTE ---------- */
    {
      id: "WST-01", topic: "waste", exam: ["env"], diff: 1, sec: 15,
      q: "Under RCRA, which subtitle governs hazardous waste from generation through treatment, storage and disposal?",
      opts: {
        A: "Subtitle C",
        B: "Subtitle D",
        C: "Subtitle I",
        D: "Subtitle J"
      },
      ans: "A",
      why: "Subtitle C is the cradle to grave hazardous waste program, while Subtitle D covers nonhazardous solid waste including municipal landfills. Subtitle I separately regulates underground storage tanks."
    },
    {
      id: "WST-02", topic: "waste", exam: ["env"], diff: 1, sec: 20,
      q: "Which of these is NOT one of the four characteristics that make a waste hazardous under RCRA?",
      opts: {
        A: "Ignitability",
        B: "Corrosivity",
        C: "Radioactivity",
        D: "Toxicity"
      },
      ans: "C",
      why: "The four characteristics are ignitability, corrosivity, reactivity and toxicity, with toxicity determined by the TCLP leaching test. Radioactive waste falls under separate nuclear regulation, not RCRA."
    },
    {
      id: "WST-03", topic: "waste", exam: ["env"], diff: 2, sec: 25,
      q: "What is the approximate composition by volume of landfill gas from a mature anaerobic municipal landfill?",
      opts: {
        A: "20 percent methane and 80 percent nitrogen",
        B: "5 percent methane and 95 percent carbon dioxide",
        C: "90 percent methane and 10 percent carbon dioxide",
        D: "About 50 percent methane and 50 percent carbon dioxide"
      },
      ans: "D",
      why: "Steady anaerobic decomposition yields roughly equal methane and carbon dioxide plus trace gases. That methane fraction gives landfill gas about half the heating value of natural gas, so it is worth collecting as fuel."
    },
    {
      id: "WST-04", topic: "waste", exam: ["env"], diff: 2, sec: 25,
      q: "A city of 50,000 people generates municipal solid waste at 2.0 kg per person per day. How much waste must be managed each day?",
      opts: {
        A: "25 tonnes",
        B: "100 tonnes",
        C: "10 tonnes",
        D: "1,000 tonnes"
      },
      ans: "B",
      why: "50,000 x 2.0 = 100,000 kg per day, which is 100 tonnes. Per capita generation rates like this are exactly how collection fleets and landfill capacity get sized."
    },
    {
      id: "WST-05", topic: "waste", exam: ["env"], diff: 2, sec: 30,
      q: "A landfill receives 100 tonnes/day of waste compacted to an in place density of 500 kg/m3. How much airspace does the waste itself occupy each day?",
      opts: {
        A: "50 m3",
        B: "500 m3",
        C: "5,000 m3",
        D: "200 m3"
      },
      ans: "D",
      why: "Volume is mass divided by density: 100,000 kg / 500 kg/m3 = 200 m3 per day. Better compaction directly extends landfill life, and daily cover soil consumes additional volume on top of this."
    },
    {
      id: "WST-06", topic: "waste", exam: ["env"], diff: 2, sec: 25,
      q: "CERCLA, commonly called Superfund, was created primarily to address what?",
      opts: {
        A: "Cleanup of abandoned or uncontrolled hazardous waste sites",
        B: "Permitting of operating hazardous waste treatment facilities",
        C: "National recycling and composting targets",
        D: "Emission limits for industrial smokestacks"
      },
      ans: "A",
      why: "CERCLA funds and compels cleanup of past contamination and assigns liability to potentially responsible parties. RCRA is the forward looking law that controls waste being generated today."
    },
    {
      id: "WST-07", topic: "waste", exam: ["env"], diff: 3, sec: 40,
      q: "A city generates 200 tonnes/day of MSW that is 30 percent paper and 20 percent yard waste. If 60 percent of the paper is recycled and all yard waste is composted, what fraction is diverted?",
      opts: {
        A: "24 percent",
        B: "30 percent",
        C: "38 percent",
        D: "50 percent"
      },
      ans: "C",
      why: "Paper diverted is 0.30 x 0.60 = 0.18 of the total, and yard waste adds another 0.20, for 0.38. The tonnage never enters the math because the question asks for a fraction, not a mass."
    },

    /* ---------- RISK & REMEDIATION ---------- */
    {
      id: "RSK-01", topic: "risk", exam: ["env"], diff: 1, sec: 15,
      q: "The LD50 of a substance is defined as the dose that does what?",
      opts: {
        A: "Produces any detectable effect in 50 percent of the population",
        B: "Is lethal to 50 percent of the exposed test population",
        C: "Produces 50 percent of the maximum possible response",
        D: "Is safe for 50 percent of the population"
      },
      ans: "B",
      why: "LD50 is the single dose that kills half the test animals, so a smaller LD50 means a more acutely toxic chemical. It describes acute lethality only and says nothing about chronic or carcinogenic effects."
    },
    {
      id: "RSK-02", topic: "risk", exam: ["env"], diff: 1, sec: 20,
      q: "What does a Phase I Environmental Site Assessment normally include?",
      opts: {
        A: "Soil borings and groundwater sampling",
        B: "Design of a remediation system",
        C: "Long term monitoring after cleanup",
        D: "Records review, site inspection and interviews with no sampling"
      },
      ans: "D",
      why: "Phase I is a records and walkover study used to identify recognized environmental conditions and support the innocent landowner defense. Sampling and laboratory analysis only begin in Phase II."
    },
    {
      id: "RSK-03", topic: "risk", exam: ["env"], diff: 2, sec: 25,
      q: "A person is exposed to a chemical at 0.05 mg/kg-day and the reference dose is 0.02 mg/kg-day. What is the hazard quotient and what does it suggest?",
      opts: {
        A: "0.4, no concern indicated",
        B: "0.4, potential concern",
        C: "2.5, potential concern",
        D: "2.5, no concern indicated"
      },
      ans: "C",
      why: "HQ is intake divided by reference dose = 0.05/0.02 = 2.5, and any value above 1 flags possible noncancer effects. Adding hazard quotients across chemicals that affect the same organ gives the hazard index."
    },
    {
      id: "RSK-04", topic: "risk", exam: ["env"], diff: 2, sec: 30,
      q: "A lifetime average daily dose is 2 x 10^-4 mg/kg-day and the cancer slope factor is 0.5 per mg/kg-day. What is the excess lifetime cancer risk?",
      opts: {
        A: "1 x 10^-4",
        B: "4 x 10^-4",
        C: "2.5 x 10^-4",
        D: "1 x 10^-3"
      },
      ans: "A",
      why: "At low doses risk is simply dose multiplied by slope factor: 2 x 10^-4 times 0.5 = 1 x 10^-4. Regulators generally treat acceptable risk as between one in a million and one in ten thousand, which is where many MCLs originate."
    },
    {
      id: "RSK-05", topic: "risk", exam: ["env"], diff: 2, sec: 25,
      q: "Soil vapor extraction is most effective at removing which contaminants from the unsaturated vadose zone?",
      opts: {
        A: "Heavy metals such as lead",
        B: "Volatile organic compounds",
        C: "Asbestos fibers",
        D: "Dissolved nitrate salts"
      },
      ans: "B",
      why: "SVE pulls air through soil pores and only works on compounds that partition into the vapor phase, meaning high vapor pressure and a high Henry law constant. Metals and salts are nonvolatile and need excavation or stabilization instead."
    },
    {
      id: "RSK-06", topic: "risk", exam: ["env"], diff: 3, sec: 45,
      q: "A 70 kg adult drinks 2 L/day of water containing 0.35 mg/L of a contaminant every day for 30 years, averaged over that same 30 years. What is the chronic daily intake?",
      opts: {
        A: "0.005 mg/kg-day",
        B: "0.02 mg/kg-day",
        C: "0.10 mg/kg-day",
        D: "0.01 mg/kg-day"
      },
      ans: "D",
      why: "Intake is concentration times ingestion rate times exposure frequency and duration, divided by body weight times averaging time. Here duration equals averaging time so those cancel, leaving 0.35 x 2 / 70 = 0.01 mg/kg-day; for carcinogens the averaging time would be a full 70 year lifetime."
    },
    {
      id: "RSK-07", topic: "risk", exam: ["env"], diff: 3, sec: 40,
      q: "A granular activated carbon unit treats 100 m3/day containing 5 mg/L of an organic. If carbon capacity is 0.10 g of contaminant per g of carbon, how much carbon is used per day?",
      opts: {
        A: "0.5 kg",
        B: "5 kg",
        C: "50 kg",
        D: "500 kg"
      },
      ans: "B",
      why: "Mass removed is 100 m3 x 5 g/m3 = 500 g per day, and dividing by a capacity of 0.1 g per g gives 5,000 g of carbon. Lower adsorption capacity means proportionally more carbon and more frequent changeouts."
    }
  ]
};
