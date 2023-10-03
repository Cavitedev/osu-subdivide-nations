import jsonOsuCountries  from './osuCountriesFilter.json';

const osuCountriesObject: { [key: string]: string } = jsonOsuCountries;

const osuNameToCode = (name: string): string| null => {
    return osuCountriesObject[name];
}

export default osuNameToCode;