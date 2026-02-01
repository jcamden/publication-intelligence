"use client";

import { Badge } from "@pubint/yabasic/components/ui/badge";
import { Button } from "@pubint/yabasic/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@pubint/yabasic/components/ui/card";
import { LandingNavbar } from "@pubint/yabasic/components/ui/landing-navbar";
import { Separator } from "@pubint/yabasic/components/ui/separator";
import { Logo } from "@pubint/yaboujee";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "./_common/_providers/theme-provider";

export default function Home() {
	const { resolvedTheme, setTheme } = useTheme();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<LandingNavbar
				theme={resolvedTheme}
				onThemeToggle={() =>
					setTheme({
						theme: resolvedTheme === "dark" ? "light" : "dark",
					})
				}
				logo={<Logo variant="gradient" size="sm" className="sm:text-4xl" />}
				homeLink={
					<Link href="/">
						<Logo variant="gradient" size="sm" className="sm:text-4xl" />
					</Link>
				}
				signInLink={
					<Link
						href="/login"
						className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
					>
						Sign In
					</Link>
				}
				signUpLink={
					<Link href="/signup" className="w-full">
						Get Started
					</Link>
				}
			/>

			{/* Hero Section */}
			<section className="pt-32 pb-20 px-6">
				<div className="px-24 mx-auto">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<h1 className="font-audiowide text-5xl lg:text-6xl font-bold mb-6 leading-tight">
								10x Your Index
							</h1>
							<p className="text-2xl text-muted-foreground mb-8 leading-relaxed">
								with AI-assisted tools for authors, indexers, and publishers.
							</p>
							<p className="text-lg mb-10">
								Generate, review, and export high-quality indices in a fraction
								of the time.
							</p>
							<div className="flex flex-col sm:flex-row gap-4">
								<Button size="lg" className="text-lg px-8 py-6">
									Get Early Access
								</Button>
								<Button
									size="lg"
									variant="outline"
									className="text-lg px-8 py-6"
								>
									Watch Demo
								</Button>
							</div>
						</div>

						<Image
							src="/img/bs-ai-mockup.png"
							alt="Split-screen interface showing index tree on left with expandable entries and subentries, highlighted PDF manuscript on right with AI-detected key concepts marked in context"
							width={1200}
							height={800}
							className="w-full h-auto rounded-2xl"
						/>
					</div>
				</div>
			</section>

			{/* Problem Section */}
			<section className="py-20 px-6 bg-muted/50">
				<div className="max-w-4xl mx-auto">
					<h2 className="font-merriweather text-4xl font-bold mb-8 text-center">
						Indexing Shouldn't Feel Like Archaeology
					</h2>
					<p className="text-xl text-muted-foreground mb-8 text-center">
						If you've ever built an index by hand, you know the pain:
					</p>
					<div className="grid md:grid-cols-2 gap-6">
						{[
							"📖 Constantly flipping pages to confirm references",
							"🔄 Manually tracking synonyms and variants",
							"🏗️ Rebuilding hierarchies over and over",
							"😰 Worrying you've missed key concepts",
							"⏰ Spending days on work that feels mechanical",
						].map((pain, index) => (
							<Card key={pain} className={index === 4 ? "md:col-span-2" : ""}>
								<CardContent className="pt-6">
									<p>{pain}</p>
								</CardContent>
							</Card>
						))}
					</div>
					<p className="text-lg text-muted-foreground text-center mt-8 italic">
						Existing tools help with formatting — not thinking.
					</p>
				</div>
			</section>

			{/* Solution Section */}
			<section className="py-20 px-6">
				<div className="max-w-5xl mx-auto">
					<h2 className="font-merriweather text-4xl font-bold mb-6 text-center">
						Meet IndexPDF: AI That Works With You
					</h2>
					<p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
						IndexPDF analyzes your manuscript and generates high-quality draft
						index entries — then lets you refine them with professional
						judgment.
					</p>
					<p className="font-merriweather text-2xl font-semibold text-center text-primary mb-16">
						You stay in control. The AI handles the grunt work.
					</p>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[
							"Find key concepts automatically",
							"See every reference in context",
							"Merge and refine entries easily",
							"Export in publisher-ready formats",
							"Finish in hours, not days",
							"Maintain professional quality standards",
						].map((benefit) => (
							<Card key={benefit}>
								<CardContent className="pt-6 flex items-start gap-3">
									<Badge variant="secondary" className="shrink-0 mt-0.5">
										✓
									</Badge>
									<span>{benefit}</span>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-20 px-6 bg-muted/50">
				<div className="max-w-6xl mx-auto">
					<h2 className="font-merriweather text-4xl font-bold mb-4 text-center">
						From Manuscript to Publishable Index
					</h2>
					<p className="text-xl text-muted-foreground mb-16 text-center">
						In 4 Simple Steps
					</p>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{[
							{
								step: "1",
								title: "Upload",
								description: "Upload your PDF manuscript",
								icon: "📤",
								alt: "[Icon: Document being uploaded with arrow pointing up]",
							},
							{
								step: "2",
								title: "Generate",
								description: "AI suggests entries, subentries, and references",
								icon: "🤖",
								alt: "[Icon: AI brain analyzing document with highlighted concepts]",
							},
							{
								step: "3",
								title: "Review",
								description: "Edit, merge, and validate using your manuscript",
								icon: "✏️",
								alt: "[Icon: Human hand refining and approving entries with checkmarks]",
							},
							{
								step: "4",
								title: "Export",
								description: "Download a clean, formatted index",
								icon: "📥",
								alt: "[Icon: Polished index document being downloaded]",
							},
						].map((item) => (
							<Card key={item.step}>
								<CardHeader className="text-center">
									<div className="text-6xl mb-4">{item.icon}</div>
									<Badge variant="outline" className="mb-2 self-center">
										Step {item.step}
									</Badge>
									<CardTitle className="font-merriweather text-2xl">
										{item.title}
									</CardTitle>
									<CardDescription>{item.description}</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="bg-muted p-4 rounded-lg">
										<p className="text-xs text-muted-foreground">{item.alt}</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Who It's For */}
			<section className="py-20 px-6">
				<div className="max-w-6xl mx-auto">
					<h2 className="font-merriweather text-4xl font-bold mb-4 text-center">
						Built for Professional Indexing Work
					</h2>
					<p className="text-xl text-muted-foreground mb-16 text-center max-w-3xl mx-auto">
						Whether you're a seasoned professional or creating your first
						academic index, IndexPDF adapts to your workflow.
					</p>
					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								title: "Freelance Indexers",
								description:
									"Speed up routine work without lowering standards. Take on more projects while maintaining the quality your clients expect.",
								icon: "👤",
							},
							{
								title: "Academic Authors",
								description:
									"Create a professional-quality index without outsourcing. Meet publisher requirements with confidence.",
								icon: "🎓",
							},
							{
								title: "Small Publishers",
								description:
									"Reduce costs and turnaround time. Deliver professional indexes faster without expanding your team.",
								icon: "📚",
							},
						].map((persona) => (
							<Card key={persona.title}>
								<CardHeader>
									<div className="text-5xl mb-4">{persona.icon}</div>
									<CardTitle className="font-merriweather text-2xl">
										{persona.title}
									</CardTitle>
									<CardDescription className="text-base">
										{persona.description}
									</CardDescription>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Key Features */}
			<section className="py-20 px-6 bg-muted/50">
				<div className="max-w-6xl mx-auto">
					<h2 className="font-merriweather text-4xl font-bold mb-4 text-center">
						Everything You Need — Nothing You Don't
					</h2>
					<p className="text-xl text-muted-foreground mb-16 text-center">
						Focused tools for professional indexing
					</p>
					<div className="grid md:grid-cols-2 gap-8">
						{[
							{
								title: "Smart Entry Generation",
								description:
									"Detects topics, clusters related terms, and suggests hierarchy. The AI understands context, not just keywords.",
								icon: "🧠",
							},
							{
								title: "Multi-Pane Editor",
								description:
									"Index tree + highlighted manuscript side by side. See every entry in context without losing your place.",
								icon: "⚡",
							},
							{
								title: "Human-in-the-Loop Controls",
								description:
									"Approve, rename, merge, and adjust every entry. You're the expert — the AI is your assistant.",
								icon: "🎯",
							},
							{
								title: "Professional Export",
								description:
									"Word, LaTeX, and InDesign-friendly formats. Ready to submit to any publisher.",
								icon: "📄",
							},
						].map((feature) => (
							<Card key={feature.title}>
								<CardHeader>
									<div className="text-4xl mb-4">{feature.icon}</div>
									<CardTitle className="font-merriweather text-2xl">
										{feature.title}
									</CardTitle>
									<CardDescription className="text-base leading-relaxed">
										{feature.description}
									</CardDescription>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Proof / Credibility */}
			<section className="py-20 px-6">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="font-merriweather text-4xl font-bold mb-8">
						Built by Someone Who's Been There
					</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Index PDF Founder,
						<span className="[word-spacing:0.2em]"> John</span> Camden, has
						worked as both a professional software engineer and as a PhD student
						tasked with indexing massive commentaries and reference works.
					</p>
					{/* <blockquote className="text-xl mb-8 bg-muted/30 rounded-r-lg">
						<p className="text-foreground/90 mb-2">
							<span className="italic mr-1">I know your pain </span> 😅
						</p>
						<cite className="text-lg not-italic text-muted-foreground">
							— John
						</cite>
					</blockquote> */}
					{/* <Card className="border-primary/20 bg-primary/5">
						<CardContent>
							<p className="text-lg font-medium">
								Currently in private beta. We're onboarding early users and
								shaping IndexPDF with professional feedback.
							</p>
						</CardContent>
					</Card> */}
				</div>
			</section>

			{/* Final CTA */}
			<section className="py-20 px-6 bg-primary text-primary-foreground">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="font-merriweather text-4xl font-bold mb-6">
						Ready to Index Faster?
					</h2>
					<p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
						We're onboarding early users and shaping IndexPDF with professional
						feedback. Join us in building the future of professional indexing.
					</p>
					<Button
						size="lg"
						variant="secondary"
						className="text-lg px-10 py-6 shadow-xl"
					>
						Get Early Access
					</Button>
					<p className="text-sm mt-4 opacity-75">No spam. Cancel anytime.</p>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-muted/50 border-t border-border py-12 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="grid md:grid-cols-4 gap-8 mb-8">
						<div>
							<Logo variant="gradient" size="sm" className="mb-4" />
							<p className="text-muted-foreground text-sm">
								Professional AI-assisted indexing for authors and publishers.
							</p>
						</div>
						<div>
							<h4 className="font-merriweather font-semibold mb-3">Product</h4>
							<ul className="space-y-2 text-sm">
								<li>
									<a
										href="#features"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Features
									</a>
								</li>
								<li>
									<a
										href="#pricing"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Pricing
									</a>
								</li>
								<li>
									<a
										href="#demo"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Demo
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-merriweather font-semibold mb-3">Company</h4>
							<ul className="space-y-2 text-sm">
								<li>
									<a
										href="#about"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										About
									</a>
								</li>
								<li>
									<a
										href="#contact"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Contact
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-merriweather font-semibold mb-3">Legal</h4>
							<ul className="space-y-2 text-sm">
								<li>
									<a
										href="#privacy"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Privacy
									</a>
								</li>
								<li>
									<a
										href="#terms"
										className="text-muted-foreground hover:text-foreground transition-colors"
									>
										Terms
									</a>
								</li>
							</ul>
						</div>
					</div>
					<Separator className="mb-8" />
					<p className="text-center text-sm text-muted-foreground">
						© 2026 IndexPDF / Publication Intelligence. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
