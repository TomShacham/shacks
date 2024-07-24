export const welcome = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Tom Shacks - Welcome</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
<div class="flex-col align-center">
    <div class="m-2"></div>
    <div class="flex-col m-8 py-4 w-full sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3">
         <h2>Shacks on Tech and Startups</h2>

        <article>
            <h2 id="welcome">Welcome</h2>
            <p>
                Here are some of my thoughts on Tech Startups. I have worked in a number of Startups and
                I tend to see the same problems come up time and again. There are no silver bullets, but I have picked
                up some pretty sane advice along the way; sometimes the hard way and sometimes the easy way (someone
                else found out the hard way and told me about it). This is a collection of all that advice.
            </p>
        </article>
        <ul>
            <li><a href="/blog/what-is-a-startup-really">What is a Startup really?</a></li>
            <li>
                Tech
                <ul>
                    <li><a href="/blog/ddia"> Notes on Designing Data-intensive Applications</a></li>
                </ul>
            </li>
            <li class="hidden">
                <a href="#business-strategy">Business strategy</a>
                <ul>
                    <li><a href="#opportunity-cost">Opportunity cost</a></li>
                    <li>Prioritisation</li>
                    <li>How to set a strategy</li>
                </ul>
            </li>
            <li class="hidden">
                Technical strategy
                <ul>
                    <li>Keep it simple</li>
                </ul>
            </li>
            <li class="hidden">
                Management
                <ul>
                    <li>5 Non-negotiables of management</li>
                </ul>
            </li>
            <li class="hidden">
                Process
                <ul>
                    <li>Lightweight planning</li>
                </ul>
            </li>
            
            <li class="hidden">
                Experimentation
                <ul>
                    <li>AB testing trials and tribulations</li>
                </ul>
            </li>
            <li class="hidden">
                Team structure
                <ul>
                    <li>The case for generalists</li>
                </ul>
            </li>
            <li class="hidden">
                Hiring & progression
                <ul>
                    <li>What is career progression in startup land?</li>
                </ul>
            </li>
            <li class="hidden">
                Interviewing
                <ul>
                    <li>5 questions for Founders (or your boss)</li>
                </ul>
            </li>
            <li class="hidden">
                Time off
                <ul>
                    <li><a href="#burn-out">Burn out</a></li>
                    <li><a href="#planning-time-off">Getting the most relaxation for your buck</a></li>
                </ul>
            </li>
        </ul>


        <div class="hidden">
            <h1 id="business-strategy">Business strategy</h1>
            <p></p>
            <h2 id="opportunity-cost">Opportunity cost</h2>
            <!-- importance of focus so that you have less thrashing time
            ie thrash is time spent switching between processes

            opportunity cost - value of an idea has to outstrip the value of another idea  -->
            <p>prioritisation</p>
            <!-- visualising breaking down work into chunks to help prioritisation  -->

            <h2>People and management</h2>
            <!--  youll be doing more of this than you wanted -->
            <!--  and if you don't want to then youll be doing even more -->
            <!--  like everyone should meditate for 10mins a day and if you dont have time then you should do 1hr of it -->
            <h3>Meaningful processes e.g. probation</h3>
            <!--  necessary to ensure the safety of the team -->
            <h3>Effectiveness vs time</h3>
            <!--  how devs get valuable after 6-12 months -->
            <h3>It's a team sport, no rock stars</h3>
            <!--  one great engineer (even if they do exist) is a liability -->
            <h3>You lose the best people - they can get better jobs most easily</h3>
            <!--  how you need to build and maintain a great culture to retain the best -->

            <h2>People management</h2>

            <article>
                <h1>Collection of all my favourite resources</h1>
                <h2>databases</h2>
                <h2>system architecture </h2>
            </article>

            <article>
                <h1>Blind leading the blind</h1>
                <p>Every startup is the process of working out that the leaders have little clue what they're doing</p>
                <p>Initially impressed by their domain knowledge because they're 1 year ahead of you (or more)</p>
                <p>
                    Then you realise that despite their access to seasoned board members and (possibly) coaching, in
                    fact
                    they don't know anything about execution, management, technology, what's going on "on the ground"
                    etc.
                </p>
                <h2></h2>
                <h2>system architecture </h2>
            </article>

            <article>
                <h2 id="burn-out">What is burnout?</h2>
            </article>
            <article>
                <h2 id="planning-time-off">Planning time off</h2>

            </article>
        </div>
    </div>
</div>
</body>
</html>
`