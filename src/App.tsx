import Globe from "./components/globe/Globe";
import { CountryDrawer } from "./components/CountryDrawer";
import { CountryListWithSearch } from "./components/CountryListWithSearch";
import { CountryInfo } from "./components/CountryInfo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const countryQueryClient = new QueryClient();

export function App() {
	return (
		<>
			<div className="fixed w-lvw h-lvh ">
				<Globe />
			</div>

			<CountryDrawer>
				<QueryClientProvider client={countryQueryClient}>
					<CountryInfo />
				</QueryClientProvider>
			</CountryDrawer>

			<div className=" fixed sm:bottom-1/4 bottom-2  w-full  ">
				<div className="max-w-md mx-auto px-2">
					<CountryListWithSearch />
				</div>
			</div>

			{
				//for later
				/* <div className="h-svh max-h-svh flex portrait:flex-col gap-3 p-3 sm:gap-10 sm:p-10 border-2 border-green-500  landscape:max-w-min mx-auto">
				<div
					id="globeZoomTarget"
					className="landscape:h-full grow landscape:w-[calc(100vh-5rem)] landscape:col-span-2 portrait:row-span-2 border-red-500 border-2"
				></div>
				<div className="landscape:h-full landscape:min-w-md landscape:w-1/3 portrait:h-3/5 portrait:w-full border-blue-500 border-2 flex items-end justify-center">
					<CountryListWithSearch />
				</div>
			</div> */
			}
		</>
	);
}

export default App;
