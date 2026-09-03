---
title: There's No Limit to How Bad Code Can Get
description: Metaphors like "a sinking ship" are often used to describe codebases, but are misleading.
  A _business_ will sink long before code quality reaches a hypothetical floor. Technical debt has
  no bankruptcy, no clean reset, so metaphors that imply an end provide a false sense of security.
date: 2026-09-04

tags: software-engineering, essay
---

TL;DR: Metaphors like "a sinking ship" are often used to describe codebases, but are misleading.
A _business_ will sink long before code quality reaches a hypothetical floor. Technical debt has
no bankruptcy, no clean reset, so metaphors that imply an end provide a false sense of security. 

<blockquote class="pull-quote">
<p>Software is in the domain of the abstract. It is not like a building, or a bridge, that is in
the physical realm where you can see and feel the nature of the thing. If you continue to add
floors and rooms to a building forever, it will collapse. Software faces no such constraint.
The code can <strong>always</strong> get worse. There can <strong>always</strong> be a new layer of indirection
or a reduction in performance.</p>
</blockquote>

## 1: Boarding a sinking ship

{% set fn1 = "I'm deliberately leaving plenty of details out in this story. The point is not to cast blame on individuals or the org (we were trying our best with the situation we were given). This retelling is imperfect and for illustrative purposes." | markdown | replace("<p>", "") | replace("</p>", "") %}

Over a decade ago I had my first encounter with an _ugly_ legacy codebase. I had just joined Amazon
as a "Software Development Engineer", fresh out of university, and worked on a team that owned code
related to {% footnoteref "1", fn1 %}processing orders{% endfootnoteref %}. On the surface, what our code had to
do seemed simple. Processing an order involved writing some things to a database and calling into
services owned by other teams, either to ask validity questions or to update bookkeeping on their
end. My colleagues and I estimated that a sufficient implementation of this system shouldn't need
more than two dozen strong engineers to maintain and evolve. Yet, our organization was
hundreds of people, and the system had grown so large and complex that it had become impossible to
learn how it all worked.

{% set fn2 = "This is a term that I believe originated from Google's engineering organization. It refers to a section of code that is poorly understood and so people are afraid of touching it." | markdown | replace("<p>", "") | replace("</p>", "") %}

It was rare to stay longer than a few years in this org, and institutional knowledge had eroded. This 
resulted in code that was full of {% footnoteref "2", fn2 %}"haunted graveyards"{% endfootnoteref %}. Fear suppressed any (under-rewarded) efforts to
simplify existing systems. The business rules for what had to be done for each type of order were
decided by people long ago who weren't around anymore. These rules could sometimes be found in a
hopelessly out of date file proudly calling itself a 'living document', but often the rules simply
were not written anywhere we could find. Tracing behavior yourself wasn't easy either because much
of the system lived across team boundaries where the code was not easy to access.

{% set fn3 = "It was cheaper for the org to throw more servers at the problem than spend any serious efforts on performance. I think at one point we could only process 1-2 orders per second on a single (beefy) machine. Like the org size, this didn't line up with our intuition, which suggested we should be handling at least two orders of magnitude more." | markdown | replace("<p>", "") | replace("</p>", "") %}

When some obscure process wasn't happening with an order that should have been happening, our pagers
would angrily notify us that someone in our tangled web of service dependencies was unhappy. As a
result of this feedback mechanism, the system stayed afloat, but remained difficult to change
and had {% footnoteref "3", fn3 %}abysmal performance{% endfootnoteref %}. Despite this, new layers were constantly added to support the latest
Amazon products and features. This felt unsustainable, and this feeling is what makes me and others
reach for a "sinking ship" as a metaphor to describe an organization that doesn't pay down their
technical debt.

{% set fn4 = "These lofty architectural goals became something of an inside joke between my colleagues and I. We would refer to them as a \"glorious future\", heavily laden with sarcasm: \"Once we are in the $NEXT_ARCHITECTURE glorious future, this won't be a problem!\"." | markdown | replace("<p>", "") | replace("</p>", "") %}
{% set fn5 = "When speaking of excessive organizational growth and friction, I feel obligated to point to [my favorite Bryan Cantril talk](https://www.youtube.com/watch?v=1KeYzjILqDo) if you want a good laugh." | markdown | replace("<p>", "") | replace("</p>", "") %}

To their credit, there were always {% footnoteref "4", fn4 %}ongoing attempts{% endfootnoteref %} to fix the architecture, and these usually
went as follows: A new manager or senior engineer joins the organization and observes that "things are bad".
Leadership at the organization agrees and _wants_ to make things better, but there are no engineers
available, so each fix attempt includes adding new engineers and {% footnoteref "5", fn5 %}teams{% endfootnoteref %}.

The re-architectures were always a failure: The system required _years_ of study to properly
understand and was constantly changing. It's not politically viable to take so long to design a
fix for the system, so naturally everyone attempting to fix things must work with
incomplete information. Some of this impatience is from within: If you are trying to
design a grand fix for such a prominently painful architecture, you are doing it in part because
you want a promotion (and you don't want to wait too long for a promotion).

{% set fn6 = "Had I not left, I would have been taking on the ownership of at least some of that new architecture as a plan to get myself promoted further, and I don't think I would have been able to do much better of a job at \"fixing\" things. A meta-point here is that I think the design of the organization and the incentives involved made good outcomes near-impossible." | markdown | replace("<p>", "") | replace("</p>", "") %}

Each cycle would end with the remains of the new attempt permanently grafted onto our architecture
and the leading engineer having departed with their requisite promotion. The increased headcount
stays because the migration plans are too painful and unpopular to actually finish. {% footnoteref "6", fn6 %}The cycle
continued{% endfootnoteref %} as it had long before I had arrived. The sinking ship seemed to have no end.

## 2: Where _does_ it end?

About three years after I had left, I was chatting on the phone with a former colleague from that
team. He had recently left the company after an impressive 6-year tenure and had witnessed the
cycle complete again.  We were commiserating, and both of us reached for the sinking ship metaphor
to describe the org, despite us having left years apart.

"Where does it end? How does it end?" he asked me, curious to hear my take on what would happen to
that org in the future. 

The question and metaphor didn't sit right with me, and I realized the question conflated two
things. Are we talking about the code, or are we talking about the company?

{% set fn7 = "For much of this post I deliberately minimized discussion of LLMs, since that will age faster than anything else I write, but I do feel obligated to address them at least partially. My opinion: If your company incentives and culture are the cause of your software degrading in quality, LLMs are not going to change that. They will accelerate you along the trajectory you are already on. I have more thoughts on this topic but I didn't want to derail this essay, so I'll make an optional-reading follow-up post on this later." %}

A _business_ can sink. Bad software is a real drag on the business, but how much that actually
matters depends on a lot of factors. For a company with plenty of cash flow like Amazon, they
can tolerate some bouts of internal rot here and there before it has any meaningful impact on their
bottom line. For another company whose business model is more sensitive to software quality, bad
software may be a latent invitation to a competitor to deliver the metaphorical hull breach (and no,
{% footnoteref "7", fn7 %}LLMs don't change this{% endfootnoteref %}).

For the code, the sinking doesn't end. It's an _infinitely_ sinking ship, because there is no limit
to how bad code can be. You didn't escape a building that was about to collapse. It is in a constant,
neverending state of collapse. There's something wrong with using words that imply there's an end.

Software is in the domain of the abstract. It is not like a building, or a bridge, that is in the
physical realm where you can see and feel the nature of the thing. If you continue
to add floors and rooms to a building forever, it will collapse. Software faces no such constraint.
The code can _always_ get worse. There can _always_ be a new layer of indirection or a
reduction in performance.

{% set fn8 = "[Enterprise fizz buzz](https://github.com/enterprisequalitycoding/fizzbuzzenterpriseedition) is something of an art project that deliberately demonstrates this aspect of software." | markdown | replace("<p>", "") | replace("</p>", "") %}

The pedants will rightfully point out that software can completely fail to function if it gets bad enough.
In practice, such breaking changes are quickly reverted. The thousands of changes that came before
to make the code worse are not. The software {% footnoteref "8", fn8 %}continues to 'work'{% endfootnoteref %}. Other cases without a single
breaking change to revert are where the ballooning costs of the bad software eclipse its benefit,
or if development velocity approaches zero because nothing can be shipped without a breakage. In all
of these cases, it is the business that dies long before the code hits any hypothetical floor (so
don't act like there's a floor!).

## 3: Technical debt has no bankruptcy

The drag of bad software on the business is a real threat and the reason why good organizations
pay attention to code quality. Since there is no abrupt failure threshold associated with software
quality, it's often described as "technical debt", which can be a better metaphor (debt can
compound forever) but is also imperfect.

Debt has an 'ending' point because bankruptcy is a forced reset, and the equivalent
in software is a full rewrite, which is [rarely an option](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/). 
{% set fn9 = "'Side channels' also happened multiple times at Amazon, albeit at a slower pace than the re-architectures I described in my tale. At a mega-corp, I would say this kind of soft-deprecation is the most likely obituary a painful legacy system gets. Unlike a [strangler fig](https://martinfowler.com/bliki/StranglerFigApplication.html) pattern that involves a proxy being installed and seeks to replace the existing system, these are built without cooperation (and so there is no proxy layer) by design." | markdown | replace("<p>", "") | replace("</p>", "") %}

The closest option that a mega-corp such as
Amazon has is what I call a side-channel, where they split off a team that builds a new, completely
disconnected system with only the minimal set of features needed for some new use case. Moving
forward they then have the option to direct more new use-cases at this simplified, separate
system. Importantly, the old system must remain and be maintained (it's not an 'end'), because all
the old use-cases still exist, and new organizational-level pain is felt whenever {% footnoteref "9", fn9 %}deciding which to
use in the future{% endfootnoteref %}. That's not exactly slate-clearing like we think of a bankruptcy.

The wrong mental models about software lead to bad decisions. If a 'hard reset' escape hatch exists,
then punting technical debt doesn't seem so bad. The belief that a rewrite around the corner could
fix things results in worse decisions today, because the decision-maker today doesn't understand
that there is no escape hatch.

Metaphors like a "collapsing building" or a "sinking ship" are not appropriate for software, yet we
can embrace them anyway to emphasize what makes software different. The building is infinitely
collapsing. The ship is infinitely sinking. There is no natural constraint that will wake your
project manager up and force them to deal with technical debt. Software will only stay high quality
if we put in the effort to stop the sinking. Grab a bucket.
