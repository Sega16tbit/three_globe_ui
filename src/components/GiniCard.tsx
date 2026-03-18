"use client";

import { TrendingUp } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { renderValue } from "@/lib/utils";

export const description = "A radial chart with stacked sections";

const chartConfig = {
	equality: {
		label: "Equality",
		color: "#e5e5e5",
	},
	inequality: {
		label: "Inequality",
		color: "#d4d4d4",
		// color: "#a1a1a1",
	},
} satisfies ChartConfig;

type Props = {
	index: unknown;
	year: unknown;
};

export function GiniCard({ index, year }: Props) {
	const chartData = [
		{ month: "january", equality: 100 - Number(index), inequality: index },
	];

	return (
		<Card className="flex flex-col gap-0">
			<CardContent className="items-centerpb-0 flex">
				<ChartContainer
					config={chartConfig}
					className="m-auto mx-auto flex aspect-square w-full max-w-[160px] scale-120 items-start justify-center overflow-clip"
				>
					<RadialBarChart
						data={chartData}
						endAngle={180}
						innerRadius={65}
						outerRadius={130}
						className="--aspect-square mt-4"
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
							fill="var(--color-inequality)"
							stackId="a"
							cornerRadius={5}
							className="stroke-transparent stroke-2"
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
			{/* <CardFooter className="flex-col gap-2 text-sm">
				<div className="flex items-center gap-2 leading-none font-medium">
					Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
				</div>
				<div className="leading-none text-muted-foreground">
					Showing total visitors for the last 6 months
				</div>
			</CardFooter> */}
		</Card>
	);
}
