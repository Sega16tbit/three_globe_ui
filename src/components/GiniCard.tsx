import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { cn, renderValue } from "@/lib/utils";

export const description = "A radial chart with stacked sections";

const chartConfig = {
	equality: {
		label: "Equality",
		color: "#e5e5e5",
	},
	inequality: {
		label: "Inequality",
		color: "#d4d4d4",
	},
} satisfies ChartConfig;

type Props = {
	className?: string;
	index?: unknown;
	year?: unknown;
};

export function GiniCard({ className, index, year }: Props) {
	const gini = index ? Number(index) : 0;

	const chartData = [{ month: "january", equality: 100 - gini, inequality: gini }];

	return (
		<Card
			className={cn("flex flex-col gap-0", className)}
			style={
				{
					"--gini": gini,
					"--gini-min": 32,
					"--gini-max": 50,

					// normalized 0 → 1
					"--t": "clamp(0, calc((var(--gini) - var(--gini-min)) / (var(--gini-max) - var(--gini-min))), 1)",

					// easing (optional but nicer)
					"--t-eased": "calc(var(--t) * var(--t))",

					// hue: 120 (green) → 0 (red)
					"--hue": "calc(120 - (120 * var(--t-eased)))",

					// optional dynamics
					"--sat": "calc(60% + 20% * var(--t))",
					"--light": "calc(55% - 10% * var(--t))",

					"--gini-color": "hsl(var(--hue), var(--sat), var(--light))",
				} as React.CSSProperties
			}
		>
			<CardContent className="flex items-center pb-0">
				<ChartContainer
					config={chartConfig}
					className="m-auto mx-auto flex aspect-square w-40 scale-120 items-start justify-center overflow-clip"
				>
					<RadialBarChart
						data={chartData}
						endAngle={180}
						innerRadius={65}
						outerRadius={130}
						className="mt-4"
					>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
											>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) - 28}
													className="fill-muted-foreground text-xs"
												>
													{renderValue(year)}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 4}
													className="fill-foreground text-2xl font-bold"
												>
													{renderValue(index)}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 38}
													className="fill-foreground text-2xl font-bold"
												>
													GINI INDEX
												</tspan>
											</text>
										);
									}
								}}
							/>
						</PolarRadiusAxis>
						<RadialBar
							dataKey="equality"
							stackId="a"
							cornerRadius={5}
							fill="var(--color-equality)"
							className="stroke-transparent stroke-2"
						/>
						<RadialBar
							dataKey="inequality"
							fill="var(--gini-color)"
							stackId="a"
							cornerRadius={5}
							className="stroke-transparent stroke-2 transition-[fill] duration-300"
						/>
					</RadialBarChart>
				</ChartContainer>
			</CardContent>
			<CardHeader className="items-center pb-0">
				<CardTitle className="sr-only">GINI INDEX</CardTitle>
				<CardDescription className="sr-only">
					year:{renderValue(year)}
				</CardDescription>
			</CardHeader>
		</Card>
	);
}
