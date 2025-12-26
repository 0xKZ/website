---
title: Zach's GameDev Story
description: I ramble for far too long about game development, too long for the 'About' page.
date: 2025-12-22

# 'evergreen' means I will try to keep the page up to date over time (but not change
# the published date)
tags: evergreen
---

This post started by me trying to write my [about]({{ '/about/' | url }}) page, but I got carried away and wrote way too much. Therefore, I'm dumping it here as a dedicated post.

### 1. Early Childhood

I have loved games for as long as I can remember, both playing games and building them. I designed many little board games in my early childhood, before being introduced to a home computer.

<!-- TODO: Find some of your old stupid board games and put a picture here -->

My first introduction to digital creation media was [the print shop](https://en.wikipedia.org/wiki/The_Print_Shop) on our computer (I don't remember the version of print shop, but I think we were using Windows 98 at the time). I used this software to make little local websites where you would navigate around by clicking images I had placed. Somehow I was very entertained and made many 'games' that were effectively mazes you would navigate by clicking images to denote your choices through a website.

<!-- Note: CSS rules will ignore you overriding the height. Overriding width instead just so the image doesn't take up too much space. -->
<img src="./baby_zach_on_computer.jpg" alt="Here I am enjoying what appears to be excel on windows XP" width="450"/>

Later, I dabbled a little bit with some products from [The Game Creators](https://en.wikipedia.org/wiki/The_Game_Creators). I remember trying and failing to wrap my little brain around DarkBasic, but I had fun with FPSC. I hung around on the forums and tried to absorb knowledge from the other, more experienced game developers there. Mostly, this time was just spent being an annoying kid.

During this time I had also tried [GameMaker 6](https://en.wikipedia.org/wiki/GameMaker), and I wasn't particularly convinced that I could make something advanced in it until I had played some games by [Darthlupi](https://archive.org/details/The_Cleaner). This guy was a real inspiration for me, and after I had found a little open source example game (or tutorial, I forget!) that he posted that used code (a pseudo-javascript language used by GameMaker called GML). Starting from this example, I taught myself programming at age 13 by digging through the (generally quite good!) documentation of GameMaker.

I had printed hundreds of pages of documentation out using my parent's printer (sorry!) that I downloaded over our dial-up internet, which I would consult when I got stuck and couldn't access the internet outside of times it was available. I spent the next ~3 years building a few freeware games to slowly grow my skills. Two of the games I made were for these multi-month competitions hosted by [YoYo Games](https://en.wikipedia.org/wiki/YoYo_Games) (who had purchased GameMaker a year or two after I had started using it). I didn't win anything (my games were bad), but they were a valuable learning experience, especially learning how to finish games and how to scope your games properly. This is something a lot of game developers really struggle with, so getting those reptitions in by making small, finished games really helped me.

<img src="./crappy_old_games.png" alt="Three bad freeware games I actually finished. Left: 'Elimod & Dagros'(Aug 2008), Center: 'The River' (Mar 2008), Right: 'Fluffum War' (2007)"/>

<!-- TODO: Mention there were many unfinished games too... -->


#### Side Note: Other childhood inspirations

- [Final Fantasy Tactics](https://en.wikipedia.org/wiki/Final_Fantasy_Tactics): My favorite game of my childhood and responsible for me falling in love with the turn-based genre. 
  - Fun fact: I first got this game when I had a playstation 2, where "X" was the button to select things, and "O" was the button to "go back". This was reversed from the playstation 1, which was the system FFT originally came out for. Because of this, I as a small child (I don't remember how old I was) got stuck on the tutorial mission because I couldn't figure out how to close a dialog box, and this frustrated me so much that I cried.
  
- [Mage Knight](https://en.wikipedia.org/wiki/Mage_Knight) (_NOT_ the board game!): This was a minatures game that I got into in elementary school. I still think the early editions of this game were really well designed, and building custom armies and situations gave me countless hours of entertainment. Unfortunately, I think the gameplay and unit design went downhill later in the life of the series before it ultimately died and had its IP revived in the form of a board game that plays nothing like the original.

- [Mount & Blade](https://en.wikipedia.org/wiki/Mount_%26_Blade_(series)): This didn't come out until I was in high school, but it was still such a fun game that heavily influenced the direction I wanted to take my 'dream game' project.


### 2. My first 'big' game

After the freeware games, at 16 I felt over-confident in my coding abilities. I felt that I was ready to build a 'big' game, which would be a digital version of a tabletop role-playing game of mine from my earlier childhood. This I will refer to as ✨The Dream Game✨ (It will come up again). I was still using GameMaker at this point, but the past several games of mine including this one were 100% using code (GML). This was way over-scoped, and I realized I was in over my head about 1 year into the project. I simply needed to build up my skills more to be able to properly take on something this complex.

<img src="./dream_game_v1.png" alt="This was the final state of V1 of the dream game. Not bad!" width="450"/>

I started a new project instead with a smaller scope, freshly inspired by the 2009 hit [Borderlands](https://en.wikipedia.org/wiki/Borderlands_(video_game)). The main inspiration from that game was the idea for procedurally-generated guns - I combined this with the idea of procdedurally-generated caves from [Spelunky](https://en.wikipedia.org/wiki/Spelunky), another favorite of mine, to make a shooter-roguelike.

This project started at the age of 17 and finished at the age of 18 (I think ~1.5 years of work total), and [Koya Rift](https://store.steampowered.com/app/328990/Koya_Rift/) was the result! I sold it through my website for a few years, until I eventually got on Steam through their "Greenlight" program. This game isn't very good - I am still proud of what I accomplished though, because I stayed on schedule and released a bigger game. It was a valuable learning experience.

<img src="./koya_rift_screenshot.png" alt="screenshot of Koya Rift"/>

The deadline for Koya Rift was real, in that I was leaving for University at age 18 to study Computer Science. I wanted to get the game finished and released so I didn't have to juggle that plus my university schoolwork because I was worried if that happened the game would never get done.

If I were doing this game over again, and had more time, I would have let it sit 'in the oven' for another year or so with a public demo, gathering feedback and making tweaks. I think in the end the content was a little too shallow and there were various usability issues that hampered it. Oh well!

After Koya Rift, I went to University to study Computer Science. The first year or so there was spent working on and eventually releasing an update for the game. The entire time, I kept ✨The Dream Game✨ in the back of my mind. Now that I had gained much valuable experience from shipping Koya Rift, I knew I could do a better job. So, I started over, still using GML, even though I was becoming reasonably competent in C++ through my job at the robotics lab and my coursework. At the time, the current owners of GameMaker were trying to re-brand it as a more serious development tool and appeared to be putting in lots of effort to improve it, so that provided a sense of confidence that the situation would improve regarding 'serious' things I wanted out of it, like testing and debugging tools. 

I met two friends during this time that wanted to help with the project. We all worked together on it for a year or so, and that was really fun. I remember telling myself I would never work alone on a project again because of how miserable it was compared to working with people (spoiler alert: that didn't happen). We had good fun, but ultimately other priorities competed and the other two dropped off of the project. 

<!--TODO: Screenshot of BK v2 !-->

### 3. Being a real adult

After my collaborators dropped off of V2 of ✨The Dream Game✨, I continued working on it for maybe 3 or 4 more years. In that time, I had graduated from my university and got my first real adult job as a software engineer in Seattle, WA. I was still working on ✨The Dream Game✨ on nights and weekends, though not quite as briskly as I was during my university years. 

During this time of my first real software engineering job, I was learning things at the fastest pace I ever had in my life. Quickly I became frustrated with my old code and old decisions, but even moreso I became frustrated with the limitations of the tools and language I was using. At my day job at this point, I was writing backend Java, and in particular one thing I noticed that the real world used to make sure that software worked was automated tests. As my ✨Dream Game✨ project continued to grow in complexity, and without any automated test framework available for GML, I slowly became more convinced over time that I was permanently handicapping the scope of the project by not having all the tools available that using a real programming language would have. My motivation waned.

The project spent a few years in limbo here, where I worked on it a tiny bit, but I mostly experimented with other programming languages and tools. I tried out [Unreal Engine 4](https://en.wikipedia.org/wiki/Unreal_Engine_4), which was the new hotness at the time. However, trying full fledged 'engines' didn't really stick for me, I liked the 'pure code' approach I had used for my previous several games. I played around some with [LibGDX](https://libgdx.com/), since it used Java, which I was using at work.

At work at the time, I was working on a high-availability backend service that was mostly doing business logic. Naturally, I spent a lot of my time thinking about problems in that domain, namely, how to avoid bugs and how to make it easier for software to 'just work'. I watched a bunch of tech talks where others opined on these issues. Over time, I found myself adopting more of a 'functional' programming pattern in my code. The defaults of Java really annoyed me - references were mutable by default, collections were mutable by default, and over time I saw how many bugs were caused by these. In particular I was ~~radicalized~~ _influenced_ by ["Simple Made Easy"](https://www.youtube.com/watch?v=SxdOUGdseq4), a talk by [Rich Hickey](https://en.wikipedia.org/wiki/Rich_Hickey). 

This line of thinking, along with talks/arguments with coworkers, led me to try out various frameworks and alt-JVM languages. I spent time building prototype side-projects with [Scala](https://www.scala-lang.org/), and I spent a bit of time trying out [Clojure](https://clojure.org/), but neither of them stuck as much as [Kotlin](https://kotlinlang.org/), which I tried pre-1.0 in late 2015.

I really, really liked Kotlin. I built a few small libraries and prototypes with Kotlin and found that it really resonated with the more functional-style of programming that I had come to love through work. This led me to continue to favor Kotlin for side projects even after I had started my second job which was writing C++. 

During this time I had slowly convinced myself to restart ✨The Dream Game✨ yet again, but in Kotlin this time. I was bouncing between my weekend-projects, and every time I went back to work on the game in GML it became more and more painful, as I couldn't help but notice how much of my time was spent fixing bugs that a real static type system and automated tests would have prevented in the first place.

So, ✨The Dream Game✨ was again started from scratch, with Kotlin as the language of choice. The years continued to go by. 

#### Side Note: Staying Motivated & Productive While Moonlighting

While I was working full-time, my game development schedule consisted, on average, of Saturday afternoons and at least one night during the week sometime. During high-motivational phases, this would be both days of the weekend and multiple nights per week. During low-motivational phases, this would just be the Saturday. I have a lot of thoughts about how I managed my motivation and productivity over time, and I want to make a separate blog post to write about them. When I eventually do that, I'll link it here.

#### Side Note: Local Community

During my full-time working years while I was moonlighting as a game developer, I typically spent every Saturday afternoon at an in-person co-working session for game developers. In Seattle, these were called "Indie Support Group" (colloquially called ISG, organized by [Seattle Indies](https://www.seattleindies.org/events/)). During 2018-2021, I lived in Pittsburgh, PA, and I set about finding my local game development community there. I helped convince the organizer of [Pittsburgh Game Makers](https://www.meetup.com/pgh-game-makers/) to start hosting Saturday co-working sessions as well, which they continued for years after I left. 

Community is important to me - when working on the game alone, it's good to chat with other game developers on a regular basis. I think this was good for my motivation, my social health, and also my game design skills because I was just having regular conversations about gameplay problems. If you're reading this and you are interested in game development, I highly recommend connecting with your local community. There's a lot of game developers out there!

### 4. The Modern Era

While working full-time, I had a goal in mind. I wanted to eventually work on my game full-time, to build my dream project. I never once felt motivated to work in the games industry, in general, or to seek publishing to try and turn the dream project into a 'real job'. Instead I viewed it as a sort of artistic magnum opus, where I wanted full control at all times (regardless of how long it took).

I saved up money with the plan on building a big enough runway to be able to complete the game project. Over time, the fire within me to do the project never went out, and eventually the urge to quit my job was unbearable, and so I stepped away from the corporate life in 2024. Maybe this will come to be seen as a huge mistake. At the time of writing this, I'm a little over 1 year in, and I'm having a lot of fun and I have no regrets. Hopefully it stays that way.

Even though I've been working on the game for a while, it's still the early days, and I don't have much to show. When I do, I'll post about it on this website. Consider subscribing to my mailing list to stay up to date. :)

-Zach

{% include "mailing_list_signup.njk" %}
