import Canvas from "./components/globe/Canvas";
import { CountryListWithSearch } from "./components/CountryListWithSearch";
import { CountryInfo } from "./components/CountryInfo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransitionContainer } from "./components/TransitionContainer";

const countryQueryClient = new QueryClient();

export function App() {
	return (
		<div className="m-0 h-full w-full touch-none overflow-hidden overscroll-none bg-black p-0">
			<Canvas />

			<div className="pointer-events-none fixed inset-x-0 bottom-2 m-auto max-h-min max-w-md px-2 pt-[40vh] sm:inset-y-0">
				<div className="pointer-events-auto relative min-h-12 overflow-clip rounded-3xl bg-white">
					<CountryListWithSearch classNameInput={"absolute inset-0 z-0 "} />
					<TransitionContainer className={"relative z-10"}>
						<QueryClientProvider client={countryQueryClient}>
							<CountryInfo />
						</QueryClientProvider>
					</TransitionContainer>
				</div>
			</div>
		</div>
	);
}

export default App;
