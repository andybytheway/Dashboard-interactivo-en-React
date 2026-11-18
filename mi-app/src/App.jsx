import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Filter,
  RotateCcw,
  FileText,
  X,
  BarChart3,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import rawCo2Data from './co2_data.json';

// ============================================================================
// CARTOGRAFÍA MUNDIAL REAL (FRONTERAS NATURALES OFICIALES)
// ============================================================================
const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const NUM_TO_ISO3 = {
  '004': 'AFG', '008': 'ALB', '012': 'DZA', '024': 'AGO', '032': 'ARG', '036': 'AUS',
  '040': 'AUT', '031': 'AZE', '044': 'BHS', '048': 'BHR', '050': 'BGD', '051': 'ARM',
  '056': 'BEL', '064': 'BTN', '068': 'BOL', '070': 'BIH', '072': 'BWA', '076': 'BRA',
  '084': 'BLZ', '090': 'SLB', '096': 'BRN', '100': 'BGR', '104': 'MMR', '108': 'BDI',
  '112': 'BLR', '116': 'KHM', '120': 'CMR', '124': 'CAN', '140': 'CAF', '144': 'LKA',
  '148': 'TCD', '152': 'CHL', '156': 'CHN', '158': 'TWN', '170': 'COL', '178': 'COG',
  '180': 'COD', '188': 'CRI', '191': 'HRV', '192': 'CUB', '196': 'CYP', '203': 'CZE',
  '204': 'BEN', '208': 'DNK', '214': 'DOM', '218': 'ECU', '818': 'EGY', '222': 'SLV',
  '226': 'GNQ', '231': 'ETH', '232': 'ERI', '233': 'EST', '242': 'FJI', '246': 'FIN',
  '250': 'FRA', '266': 'GAB', '268': 'GEO', '270': 'GMB', '275': 'PSE', '276': 'DEU',
  '288': 'GHA', '300': 'GRC', '304': 'GRL', '320': 'GTM', '324': 'GIN', '328': 'GUY',
  '332': 'HTI', '340': 'HND', '348': 'HUN', '352': 'ISL', '356': 'IND', '360': 'IDN',
  '364': 'IRN', '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '384': 'CIV',
  '388': 'JAM', '392': 'JPN', '398': 'KAZ', '400': 'JOR', '404': 'KEN', '408': 'PRK',
  '410': 'KOR', '414': 'KWT', '417': 'KGZ', '418': 'LAO', '422': 'LBN', '426': 'LSO',
  '428': 'LVA', '430': 'LBR', '434': 'LBY', '440': 'LTU', '442': 'LUX', '450': 'MDG',
  '454': 'MWI', '458': 'MYS', '466': 'MLI', '478': 'MRT', '484': 'MEX', '496': 'MNG',
  '498': 'MDA', '499': 'MNE', '504': 'MAR', '508': 'MOZ', '512': 'OMN', '516': 'NAM',
  '524': 'NPL', '528': 'NLD', '540': 'NCL', '548': 'VUT', '554': 'NZL', '558': 'NIC',
  '562': 'NER', '566': 'NGA', '578': 'NOR', '586': 'PAK', '591': 'PAN', '598': 'PNG',
  '600': 'PRY', '604': 'PER', '608': 'PHL', '616': 'POL', '620': 'PRT', '630': 'PRI',
  '634': 'QAT', '642': 'ROU', '643': 'RUS', '646': 'RWA', '682': 'SAU', '686': 'SEN',
  '688': 'SRB', '694': 'SLE', '703': 'SVK', '704': 'VNM', '705': 'SVN', '706': 'SOM',
  '710': 'ZAF', '716': 'ZWE', '724': 'ESP', '728': 'SSD', '729': 'SDN', '740': 'SUR',
  '748': 'SWZ', '752': 'SWE', '756': 'CHE', '760': 'SYR', '762': 'TJK', '764': 'THA',
  '768': 'TGO', '780': 'TTO', '784': 'ARE', '788': 'TUN', '792': 'TUR', '795': 'TKM',
  '800': 'UGA', '804': 'UKR', '807': 'MKD', '826': 'GBR', '834': 'TZA', '840': 'USA',
  '854': 'BFA', '858': 'URY', '860': 'UZB', '862': 'VEN', '887': 'YEM', '894': 'ZMB'
};

// ============================================================================
// PALETA DE COLORES FUNCIONAL Y ACCESIBLE (FASE 2 - SIN CONFLICTO ROJO/VERDE)
// ============================================================================
const COLORS = {
  slateBlue: '#1E3A5F',
  emerald: '#2A9D8F',
  amber: '#E9C46A',
  coral: '#E76F51',
  canvas: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8'
};

const ISO_TO_REGION = {
  ARG: 'América', ATG: 'América', BHS: 'América', BLZ: 'América', BOL: 'América',
  BRA: 'América', BRB: 'América', CAN: 'América', CHL: 'América', COL: 'América',
  CRI: 'América', CUB: 'América', CUW: 'América', DMA: 'América', DOM: 'América',
  ECU: 'América', GLP: 'América', GRD: 'América', GTM: 'América', GUF: 'América',
  GUY: 'América', HND: 'América', HTI: 'América', JAM: 'América', KNA: 'América',
  LCA: 'América', MEX: 'América', NIC: 'América', PAN: 'América', PER: 'América',
  PRY: 'América', SLV: 'América', SUR: 'América', TTO: 'América', URY: 'América',
  USA: 'América', VCT: 'América', VEN: 'América', VGB: 'América', ABW: 'América',
  AIA: 'América', BES: 'América', BMU: 'América',
  ALB: 'Europa', AND: 'Europa', AUT: 'Europa', BEL: 'Europa', BGR: 'Europa',
  BIH: 'Europa', BLR: 'Europa', CHE: 'Europa', CYP: 'Europa', CZE: 'Europa',
  DEU: 'Europa', DNK: 'Europa', ESP: 'Europa', EST: 'Europa', FIN: 'Europa',
  FRA: 'Europa', FRO: 'Europa', GBR: 'Europa', GRC: 'Europa', GRL: 'Europa',
  HRV: 'Europa', HUN: 'Europa', IRL: 'Europa', ISL: 'Europa', ITA: 'Europa',
  LIE: 'Europa', LTU: 'Europa', LUX: 'Europa', LVA: 'Europa', MDA: 'Europa',
  MKD: 'Europa', MLT: 'Europa', MNE: 'Europa', NLD: 'Europa', NOR: 'Europa',
  POL: 'Europa', PRT: 'Europa', ROU: 'Europa', RUS: 'Europa', SRB: 'Europa',
  SVK: 'Europa', SVN: 'Europa', SWE: 'Europa', UKR: 'Europa',
  AFG: 'Asia', ARE: 'Asia', ARM: 'Asia', AZE: 'Asia', BGD: 'Asia', BHR: 'Asia',
  BRN: 'Asia', BTN: 'Asia', CHN: 'Asia', GEO: 'Asia', HKG: 'Asia', IDN: 'Asia',
  IND: 'Asia', IRN: 'Asia', IRQ: 'Asia', ISR: 'Asia', JOR: 'Asia', JPN: 'Asia',
  KAZ: 'Asia', KGZ: 'Asia', KHM: 'Asia', KOR: 'Asia', KWT: 'Asia', LAO: 'Asia',
  LBN: 'Asia', LKA: 'Asia', MAC: 'Asia', MDV: 'Asia', MMR: 'Asia', MNG: 'Asia',
  MYS: 'Asia', NPL: 'Asia', OMN: 'Asia', PAK: 'Asia', PHL: 'Asia', PRK: 'Asia',
  PSE: 'Asia', QAT: 'Asia', SAU: 'Asia', SGP: 'Asia', SYR: 'Asia', THA: 'Asia',
  TJK: 'Asia', TKM: 'Asia', TLS: 'Asia', TUR: 'Asia', TWN: 'Asia', UZB: 'Asia',
  VNM: 'Asia', YEM: 'Asia',
  AGO: 'África', BDI: 'África', BEN: 'África', BFA: 'África', BWA: 'África',
  CAF: 'África', CIV: 'África', CMR: 'África', COD: 'África', COG: 'África',
  COM: 'África', CPV: 'África', DJI: 'África', DZA: 'África', EGY: 'África',
  ERI: 'África', ETH: 'África', GAB: 'África', GHA: 'África', GIN: 'África',
  GMB: 'África', GNB: 'África', GNQ: 'África', KEN: 'África', LBR: 'África',
  LBY: 'África', LSO: 'África', MAR: 'África', MDG: 'África', MLI: 'África',
  MOZ: 'África', MRT: 'África', MUS: 'África', MWI: 'África', NAM: 'África',
  NER: 'África', NGA: 'África', RWA: 'África', SDN: 'África', SEN: 'África',
  SLE: 'África', SOM: 'África', SSD: 'África', STP: 'África', SWZ: 'África',
  SYC: 'África', TCD: 'África', TGO: 'África', TUN: 'África', TZA: 'África',
  UGA: 'África', ZAF: 'África', ZMB: 'África', ZWE: 'África',
  AUS: 'Oceanía', COK: 'Oceanía', FJI: 'Oceanía', FSM: 'Oceanía', KIR: 'Oceanía',
  MHL: 'Oceanía', NCL: 'Oceanía', NIU: 'Oceanía', NRU: 'Oceanía', NZL: 'Oceanía',
  PLW: 'Oceanía', PNG: 'Oceanía', PYF: 'Oceanía', SLB: 'Oceanía', TON: 'Oceanía',
  TUV: 'Oceanía', VUT: 'Oceanía', WSM: 'Oceanía'
};

function getEmissionColor(co2PerCapita) {
  if (co2PerCapita == null || isNaN(co2PerCapita)) return '#E2E8F0';
  const clamped = Math.max(0, Math.min(25, co2PerCapita));
  const ratio = clamped / 25;

  const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);

  let c1, c2, t;
  if (ratio < 0.5) {
    c1 = hexToRgb(COLORS.emerald);
    c2 = hexToRgb(COLORS.amber);
    t = ratio * 2;
  } else {
    c1 = hexToRgb(COLORS.amber);
    c2 = hexToRgb(COLORS.coral);
    t = (ratio - 0.5) * 2;
  }
  return `rgb(${lerp(c1[0], c2[0], t)}, ${lerp(c1[1], c2[1], t)}, ${lerp(c1[2], c2[2], t)})`;
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 88;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function App() {
  const [worldPaths, setWorldPaths] = useState([]);

  // Cargar geometría geográfica real con D3-Geo + TopoJSON
  useEffect(() => {
    fetch(WORLD_ATLAS_URL)
      .then((res) => res.json())
      .then((topology) => {
        const countriesGeo = feature(topology, topology.objects.countries);
        const filteredFeatures = countriesGeo.features.filter((f) => String(f.id) !== '010');
        const projection = geoNaturalEarth1().fitSize([900, 420], {
          type: 'FeatureCollection',
          features: filteredFeatures
        });
        const pathGenerator = geoPath().projection(projection);

        const computed = filteredFeatures.map((feat, idx) => ({
          key: feat.id || idx,
          iso3: NUM_TO_ISO3[String(feat.id).padStart(3, '0')] || null,
          d: pathGenerator(feat)
        }));
        setWorldPaths(computed);
      })
      .catch(console.error);
  }, []);

  const dataset = useMemo(() => {
    return rawCo2Data
      .filter((d) => d.iso_code && d.iso_code.length === 3 && !d.iso_code.startsWith('OWID'))
      .map((d) => ({
        ...d,
        region: ISO_TO_REGION[d.iso_code] || 'Otras Regiones'
      }));
  }, []);

  const availableYears = useMemo(() => {
    return Array.from(new Set(dataset.map((d) => d.year))).sort((a, b) => a - b);
  }, [dataset]);

  const defaultYear = availableYears.includes(2022)
    ? 2022
    : availableYears[availableYears.length - 1] || 2022;

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [minPopulation, setMinPopulation] = useState(0);
  const [selectedCountryIso, setSelectedCountryIso] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const filteredSeriesData = useMemo(() => {
    return dataset.filter((d) => {
      const matchRegion = selectedRegion === 'Todas' || d.region === selectedRegion;
      const matchPop = (d.population || 0) >= minPopulation;
      return matchRegion && matchPop;
    });
  }, [dataset, selectedRegion, minPopulation]);

  const currentYearData = useMemo(
    () => filteredSeriesData.filter((d) => d.year === selectedYear),
    [filteredSeriesData, selectedYear]
  );

  const countryByIsoMap = useMemo(() => {
    const map = {};
    currentYearData.forEach((d) => {
      map[d.iso_code] = d;
    });
    return map;
  }, [currentYearData]);

  const prevYearData = useMemo(
    () => filteredSeriesData.filter((d) => d.year === selectedYear - 1),
    [filteredSeriesData, selectedYear]
  );

  const kpiMetrics = useMemo(() => {
    const scopeNow = selectedCountryIso
      ? currentYearData.filter((d) => d.iso_code === selectedCountryIso)
      : currentYearData;
    const scopePrev = selectedCountryIso
      ? prevYearData.filter((d) => d.iso_code === selectedCountryIso)
      : prevYearData;

    const sumCo2Now = scopeNow.reduce((acc, d) => acc + (d.co2 || 0), 0);
    const sumPopNow = scopeNow.reduce((acc, d) => acc + (d.population || 0), 0);

    const sumCo2Prev = scopePrev.reduce((acc, d) => acc + (d.co2 || 0), 0);
    const sumPopPrev = scopePrev.reduce((acc, d) => acc + (d.population || 0), 0);

    const perCapitaNow =
      scopeNow.length === 1
        ? scopeNow[0].co2_per_capita
        : sumPopNow > 0
        ? (sumCo2Now * 1e6) / sumPopNow
        : 0;
    const perCapitaPrev =
      scopePrev.length === 1
        ? scopePrev[0].co2_per_capita
        : sumPopPrev > 0
        ? (sumCo2Prev * 1e6) / sumPopPrev
        : 0;

    const totalGtNow = sumCo2Now / 1000;
    const totalGtPrev = sumCo2Prev / 1000;

    const withGdpNow = scopeNow.filter((d) => d.gdp > 0);
    const co2WithGdpNow = withGdpNow.reduce((acc, d) => acc + (d.co2 || 0), 0);
    const gdpOnlyNow = withGdpNow.reduce((acc, d) => acc + d.gdp, 0);
    const intensityNow = gdpOnlyNow > 0 ? (co2WithGdpNow * 1e9) / gdpOnlyNow : 0;

    const withGdpPrev = scopePrev.filter((d) => d.gdp > 0);
    const co2WithGdpPrev = withGdpPrev.reduce((acc, d) => acc + (d.co2 || 0), 0);
    const gdpOnlyPrev = withGdpPrev.reduce((acc, d) => acc + d.gdp, 0);
    const intensityPrev = gdpOnlyPrev > 0 ? (co2WithGdpPrev * 1e9) / gdpOnlyPrev : 0;

    const calcDelta = (now, prev) => (prev > 0 ? ((now - prev) / prev) * 100 : 0);

    const sparkYears = availableYears.filter((y) => y <= selectedYear).slice(-12);
    const sparkPerCapita = [];
    const sparkTotalGt = [];
    const sparkIntensity = [];

    sparkYears.forEach((yr) => {
      const rows = filteredSeriesData.filter(
        (d) => d.year === yr && (!selectedCountryIso || d.iso_code === selectedCountryIso)
      );
      const c = rows.reduce((a, b) => a + (b.co2 || 0), 0);
      const p = rows.reduce((a, b) => a + (b.population || 0), 0);
      const gRows = rows.filter((r) => r.gdp > 0);
      const cg = gRows.reduce((a, b) => a + (b.co2 || 0), 0);
      const gg = gRows.reduce((a, b) => a + b.gdp, 0);

      sparkPerCapita.push(rows.length === 1 ? rows[0].co2_per_capita : p > 0 ? (c * 1e6) / p : 0);
      sparkTotalGt.push(c / 1000);
      sparkIntensity.push(gg > 0 ? (cg * 1e9) / gg : 0);
    });

    return {
      perCapitaNow,
      perCapitaDelta: calcDelta(perCapitaNow, perCapitaPrev),
      totalGtNow,
      totalGtDelta: calcDelta(totalGtNow, totalGtPrev),
      intensityNow,
      intensityDelta: calcDelta(intensityNow, intensityPrev),
      sparkPerCapita,
      sparkTotalGt,
      sparkIntensity,
      activeEntityName:
        selectedCountryIso && scopeNow[0]
          ? scopeNow[0].country
          : selectedRegion === 'Todas'
          ? 'Promedio Global Filtrado'
          : `Región: ${selectedRegion}`
    };
  }, [currentYearData, prevYearData, filteredSeriesData, selectedYear, selectedCountryIso, selectedRegion, availableYears]);

  const topRanking = useMemo(() => {
    return [...currentYearData]
      .sort((a, b) => b.co2_per_capita - a.co2_per_capita)
      .slice(0, 8);
  }, [currentYearData]);

  const timeSeries = useMemo(() => {
    return availableYears.map((yr) => {
      const rows = filteredSeriesData.filter(
        (d) => d.year === yr && (!selectedCountryIso || d.iso_code === selectedCountryIso)
      );
      const totalMt = rows.reduce((acc, d) => acc + (d.co2 || 0), 0);
      const totalPop = rows.reduce((acc, d) => acc + (d.population || 0), 0);
      const avgPerCapita =
        rows.length === 1 ? rows[0].co2_per_capita : totalPop > 0 ? (totalMt * 1e6) / totalPop : 0;
      return {
        year: yr,
        totalGt: totalMt / 1000,
        perCapita: avgPerCapita
      };
    });
  }, [filteredSeriesData, availableYears, selectedCountryIso]);

  const scatterPoints = useMemo(() => {
    return currentYearData
      .filter((d) => d.gdp > 0 && d.population > 0 && d.co2_per_capita > 0)
      .map((d) => ({
        ...d,
        gdpPerCapita: d.gdp / d.population
      }));
  }, [currentYearData]);

  const handleResetFilters = () => {
    setSelectedYear(defaultYear);
    setSelectedRegion('Todas');
    setMinPopulation(0);
    setSelectedCountryIso(null);
  };

  const maxTopPerCapita = topRanking[0]?.co2_per_capita || 1;

  return (
    <div
      className="min-h-screen p-4 md:p-6 font-sans antialiased"
      style={{ backgroundColor: COLORS.canvas, color: COLORS.textPrimary }}
    >
      <div className="max-w-[1440px] mx-auto space-y-4">
        {/* FILA 1: ENCABEZADO + CONTROLES */}
        <header
          className="bg-white rounded-xl p-4 border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          style={{ borderColor: COLORS.border }}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white"
                style={{ backgroundColor: COLORS.slateBlue }}
              >
                <Globe className="w-4 h-4" />
              </span>
              <h1
                className="text-xl md:text-2xl font-bold tracking-tight"
                style={{ color: COLORS.slateBlue }}
              >
                Huella de Carbono Global
              </h1>
              <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Dashboard Estratégico · ISO-3 ({currentYearData.length} países)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ¿Quién contamina más? Evaluación de intensidad individual (CO₂ per cápita) vs. volumen absoluto y eficiencia económica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <label className="text-xs font-medium text-slate-600">Año:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-semibold bg-transparent focus:outline-none text-slate-800 cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <label className="text-xs font-medium text-slate-600">Región:</label>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedCountryIso(null);
                }}
                className="text-xs font-semibold bg-transparent focus:outline-none text-slate-800 cursor-pointer"
              >
                <option value="Todas">Todas (Global)</option>
                <option value="América">América</option>
                <option value="Europa">Europa</option>
                <option value="Asia">Asia</option>
                <option value="África">África</option>
                <option value="Oceanía">Oceanía</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <label className="text-xs font-medium text-slate-600">Población mín.:</label>
              <select
                value={minPopulation}
                onChange={(e) => setMinPopulation(Number(e.target.value))}
                className="text-xs font-semibold bg-transparent focus:outline-none text-slate-800 cursor-pointer"
              >
                <option value={0}>Todos los países</option>
                <option value={1000000}>&gt; 1 millón hab.</option>
                <option value={10000000}>&gt; 10 millones hab.</option>
                <option value={50000000}>&gt; 50 millones hab.</option>
              </select>
            </div>

            {(selectedRegion !== 'Todas' || minPopulation > 0 || selectedCountryIso) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}

            <button
              onClick={() => setShowDocsModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
              style={{ backgroundColor: COLORS.slateBlue }}
            >
              <FileText className="w-3.5 h-3.5" />
              Documentación Fase 3
            </button>
          </div>
        </header>

        {selectedCountryIso && (
          <div className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center justify-between text-xs">
            <span>
              Filtrando vista individual por país: <strong>{kpiMetrics.activeEntityName}</strong> ({selectedCountryIso})
            </span>
            <button
              onClick={() => setSelectedCountryIso(null)}
              className="underline hover:text-amber-300 font-medium"
            >
              Volver a vista agregada
            </button>
          </div>
        )}

        {/* FILA 2: TARJETAS KPI */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div
            className="md:col-span-4 bg-white rounded-xl p-5 border shadow-xs flex flex-col justify-between"
            style={{
              borderColor: COLORS.border,
              borderTopWidth: '4px',
              borderTopColor: COLORS.coral
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  KPI Principal · Intensidad Individual
                </span>
                <h2 className="text-sm font-semibold text-slate-800 mt-0.5">
                  CO₂ Per Cápita ({selectedYear})
                </h2>
              </div>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-50"
                style={{ color: COLORS.coral }}
              >
                Métrica Reina
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  {kpiMetrics.perCapitaNow.toFixed(2)}
                </span>
                <span className="text-sm font-medium text-slate-500 ml-1.5">t / hab</span>
              </div>
              <Sparkline data={kpiMetrics.sparkPerCapita} color={COLORS.coral} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 truncate max-w-[180px]">{kpiMetrics.activeEntityName}</span>
              <span
                className="inline-flex items-center gap-1 font-semibold"
                style={{
                  color: kpiMetrics.perCapitaDelta > 0 ? COLORS.coral : COLORS.emerald
                }}
              >
                {kpiMetrics.perCapitaDelta > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {kpiMetrics.perCapitaDelta >= 0 ? '+' : ''}
                {kpiMetrics.perCapitaDelta.toFixed(1)}% vs {selectedYear - 1}
              </span>
            </div>
          </div>

          <div
            className="md:col-span-4 bg-white rounded-xl p-5 border flex flex-col justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  KPI Secundario · Volumen Bruto
                </span>
                <h2 className="text-sm font-semibold text-slate-800 mt-0.5">
                  Emisiones Totales de CO₂ ({selectedYear})
                </h2>
              </div>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl md:text-3xl font-bold text-slate-900">
                  {kpiMetrics.totalGtNow >= 1
                    ? kpiMetrics.totalGtNow.toFixed(2)
                    : (kpiMetrics.totalGtNow * 1000).toFixed(1)}
                </span>
                <span className="text-sm font-medium text-slate-500 ml-1.5">
                  {kpiMetrics.totalGtNow >= 1 ? 'Gt CO₂' : 'Mt CO₂'}
                </span>
              </div>
              <Sparkline data={kpiMetrics.sparkTotalGt} color={COLORS.slateBlue} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">Contrapeso de escala global</span>
              <span
                className="inline-flex items-center gap-1 font-semibold"
                style={{
                  color: kpiMetrics.totalGtDelta > 0 ? COLORS.coral : COLORS.emerald
                }}
              >
                {kpiMetrics.totalGtDelta >= 0 ? '+' : ''}
                {kpiMetrics.totalGtDelta.toFixed(1)}% interanual
              </span>
            </div>
          </div>

          <div
            className="md:col-span-4 bg-white rounded-xl p-5 border flex flex-col justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  KPI Secundario · Desacoplamiento
                </span>
                <h2 className="text-sm font-semibold text-slate-800 mt-0.5">
                  Intensidad Carbono / PIB ({selectedYear})
                </h2>
              </div>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl md:text-3xl font-bold text-slate-900">
                  {kpiMetrics.intensityNow > 0 ? kpiMetrics.intensityNow.toFixed(3) : 'N/D'}
                </span>
                {kpiMetrics.intensityNow > 0 && (
                  <span className="text-sm font-medium text-slate-500 ml-1.5">kg CO₂ / $</span>
                )}
              </div>
              <Sparkline data={kpiMetrics.sparkIntensity} color={COLORS.emerald} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                {kpiMetrics.intensityNow > 0
                  ? 'Eficiencia económica ambiental'
                  : 'PIB no reportado en OWID para este año'}
              </span>
              {kpiMetrics.intensityNow > 0 && kpiMetrics.intensityDelta !== 0 && (
                <span
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{
                    color: kpiMetrics.intensityDelta > 0 ? COLORS.coral : COLORS.emerald
                  }}
                >
                  {kpiMetrics.intensityDelta >= 0 ? '+' : ''}
                  {kpiMetrics.intensityDelta.toFixed(1)}% interanual
                </span>
              )}
            </div>
          </div>
        </section>

        {/* FILA 3: MAPA COROPLÉTICO MUNDIAL REAL (D3-GEO) + RANKING */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div
            className="lg:col-span-8 bg-white rounded-xl p-5 border flex flex-col justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="text-base font-bold" style={{ color: COLORS.slateBlue }}>
                  Distribución Geográfica de Emisiones Per Cápita ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500">
                  Haz clic en cualquier nación del mapa para aislar su trayectoria histórica y métricas.
                </p>
              </div>
              {hoveredCountry && (
                <div className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xs">
                  <strong>{hoveredCountry.country}</strong>: {hoveredCountry.co2_per_capita.toFixed(2)} t/hab ·{' '}
                  {hoveredCountry.co2.toFixed(1)} Mt totales
                </div>
              )}
            </div>

            {/* Lienzo Cartográfico con Fronteras Reales del Mundo */}
            <div className="relative w-full bg-slate-50/80 rounded-lg border border-slate-100 overflow-hidden h-[290px] md:h-[325px] flex items-center justify-center">
              {worldPaths.length === 0 ? (
                <span className="text-xs text-slate-400">Cargando cartografía mundial...</span>
              ) : (
                <svg viewBox="0 0 900 420" className="w-full h-full">
                  {worldPaths.map((geo) => {
                    const record = geo.iso3 ? countryByIsoMap[geo.iso3] : null;
                    const isSelected = geo.iso3 && selectedCountryIso === geo.iso3;
                    return (
                      <path
                        key={geo.key}
                        d={geo.d}
                        fill={record ? getEmissionColor(record.co2_per_capita) : '#E2E8F0'}
                        stroke={isSelected ? COLORS.slateBlue : '#FFFFFF'}
                        strokeWidth={isSelected ? 1.6 : 0.45}
                        className="transition-opacity duration-150 hover:opacity-80"
                        style={{ cursor: record ? 'pointer' : 'default' }}
                        onMouseEnter={() => {
                          if (record) setHoveredCountry(record);
                        }}
                        onMouseLeave={() => setHoveredCountry(null)}
                        onClick={() => {
                          if (record) {
                            setSelectedCountryIso(isSelected ? null : geo.iso3);
                          }
                        }}
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <span className="font-medium text-slate-500">0 t/hab</span>
                <div
                  className="h-2.5 flex-1 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${COLORS.emerald} 0%, ${COLORS.amber} 50%, ${COLORS.coral} 100%)`
                  }}
                />
                <span className="font-medium text-slate-500">≥ 25 t/hab</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Proyección Natural Earth · Escala uniforme sin conflicto rojo-verde
              </span>
            </div>
          </div>

          {/* Ranking Top Emisores Per Cápita */}
          <div
            className="lg:col-span-4 bg-white rounded-xl p-5 border flex flex-col justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold" style={{ color: COLORS.slateBlue }}>
                  Top Emisores Per Cápita
                </h3>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Toneladas por habitante ({selectedYear}) · Orden descendente
              </p>

              <div className="space-y-3">
                {topRanking.map((item, idx) => {
                  const pct = Math.min(100, (item.co2_per_capita / maxTopPerCapita) * 100);
                  const isSelected = selectedCountryIso === item.iso_code;
                  return (
                    <div
                      key={item.iso_code}
                      onClick={() =>
                        setSelectedCountryIso(isSelected ? null : item.iso_code)
                      }
                      className={`cursor-pointer p-1.5 rounded-lg transition ${
                        isSelected ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 truncate pr-2">
                          {idx + 1}. {item.country}
                        </span>
                        <span className="font-bold text-slate-900 shrink-0">
                          {item.co2_per_capita.toFixed(2)} t
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: COLORS.coral
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 pt-2 border-t border-slate-100">
              * Codificación uniforme en Coral (#E76F51) para alertar alta intensidad individual.
            </p>
          </div>
        </section>

        {/* FILA 4: SERIE TEMPORAL + DISPERSIÓN LOGARÍTMICA */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div
            className="lg:col-span-6 bg-white rounded-xl p-5 border flex flex-col justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold" style={{ color: COLORS.slateBlue }}>
                  Evolución Histórica (1990 – {availableYears[availableYears.length - 1]})
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  CO₂ Per Cápita (t/hab)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">
                Trayectoria estratégica a largo plazo · Línea vertical indica año activo ({selectedYear}).
              </p>
            </div>

            <div className="w-full">
              {(() => {
                const w = 540;
                const h = 210;
                const padL = 38;
                const padR = 16;
                const padT = 16;
                const padB = 28;
                const maxVal = Math.max(...timeSeries.map((d) => d.perCapita), 1);
                const minYr = availableYears[0] || 1990;
                const maxYr = availableYears[availableYears.length - 1] || 2025;
                const yrSpan = maxYr - minYr || 1;

                const getX = (yr) => padL + ((yr - minYr) / yrSpan) * (w - padL - padR);
                const getY = (val) => h - padB - (val / maxVal) * (h - padT - padB);

                const linePoints = timeSeries
                  .map((d) => `${getX(d.year).toFixed(1)},${getY(d.perCapita).toFixed(1)}`)
                  .join(' ');

                const activeX = getX(selectedYear);

                return (
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[210px]">
                    {[0, 0.5, 1].map((t) => {
                      const y = h - padB - t * (h - padT - padB);
                      return (
                        <g key={t}>
                          <line
                            x1={padL}
                            y1={y}
                            x2={w - padR}
                            y2={y}
                            stroke="#E2E8F0"
                            strokeDasharray="3 3"
                          />
                          <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#64748B">
                            {(maxVal * t).toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {[1990, 2000, 2010, 2020, maxYr].map((yr) => (
                      <text
                        key={yr}
                        x={getX(yr)}
                        y={h - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748B"
                      >
                        {yr}
                      </text>
                    ))}

                    <line
                      x1={activeX}
                      y1={padT}
                      x2={activeX}
                      y2={h - padB}
                      stroke={COLORS.coral}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    <polyline
                      fill="none"
                      stroke={COLORS.slateBlue}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={linePoints}
                    />
                  </svg>
                );
              })()}
            </div>
          </div>

          <div
            className="lg:col-span-6 bg-white rounded-xl p-5 border flex flex-col justify-between"
            style={{ borderColor: COLORS.border }}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold" style={{ color: COLORS.slateBlue }}>
                  Relación Riqueza vs. Emisiones ({selectedYear})
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Escala Log₁₀ (Manejo de Outliers)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">
                PIB per cápita ($) vs. CO₂ per cápita (t/hab) · Conserva picos reales sin distorsión.
              </p>
            </div>

            <div className="w-full">
              {(() => {
                const w = 540;
                const h = 210;
                const padL = 42;
                const padR = 16;
                const padT = 16;
                const padB = 30;

                const minLogX = 2.7;
                const maxLogX = 5.2;
                const minLogY = -1.5;
                const maxLogY = 1.7;

                const getX = (gdpPc) => {
                  const lx = Math.max(minLogX, Math.min(maxLogX, Math.log10(gdpPc)));
                  return padL + ((lx - minLogX) / (maxLogX - minLogX)) * (w - padL - padR);
                };
                const getY = (co2Pc) => {
                  const ly = Math.max(minLogY, Math.min(maxLogY, Math.log10(co2Pc)));
                  return h - padB - ((ly - minLogY) / (maxLogY - minLogY)) * (h - padT - padB);
                };

                return (
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[210px]">
                    {[0.1, 1, 10, 40].map((val) => {
                      const y = getY(val);
                      return (
                        <g key={val}>
                          <line
                            x1={padL}
                            y1={y}
                            x2={w - padR}
                            y2={y}
                            stroke="#E2E8F0"
                            strokeDasharray="3 3"
                          />
                          <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#64748B">
                            {val}t
                          </text>
                        </g>
                      );
                    })}

                    <text x={padL} y={h - 8} textAnchor="start" fontSize="10" fill="#64748B">
                      Bajo PIB ($1k)
                    </text>
                    <text
                      x={(padL + w - padR) / 2}
                      y={h - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748B"
                    >
                      PIB per cápita (Escala Log₁₀)
                    </text>
                    <text x={w - padR} y={h - 8} textAnchor="end" fontSize="10" fill="#64748B">
                      Alto PIB ($100k+)
                    </text>

                    <line
                      x1={padL + 10}
                      y1={h - padB - 18}
                      x2={w - padR - 15}
                      y2={padT + 22}
                      stroke={COLORS.slateBlue}
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                      opacity="0.45"
                    />

                    {scatterPoints.map((pt) => {
                      const cx = getX(pt.gdpPerCapita);
                      const cy = getY(pt.co2_per_capita);
                      const isSelected = selectedCountryIso === pt.iso_code;
                      return (
                        <circle
                          key={pt.iso_code}
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 6.5 : 4}
                          fill={getEmissionColor(pt.co2_per_capita)}
                          stroke={isSelected ? COLORS.slateBlue : '#FFFFFF'}
                          strokeWidth={isSelected ? 2 : 0.8}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredCountry(pt)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          onClick={() =>
                            setSelectedCountryIso(isSelected ? null : pt.iso_code)
                          }
                        />
                      );
                    })}
                  </svg>
                );
              })()}
            </div>
          </div>
        </section>

        <footer className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
          <span>
            Fuente: Our World in Data (owid/co2-data) · Preprocesamiento ISO-3 (sin agregados regionales).
          </span>
          <span>
            Universidad del Caribe · Visualización de Datos · Fase 3: Implementación en React
          </span>
        </footer>
      </div>

      {/* MODAL DE DOCUMENTACIÓN TÉCNICA */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" style={{ color: COLORS.slateBlue }} />
                <h2 className="text-lg font-bold" style={{ color: COLORS.slateBlue }}>
                  Documentación Técnica — Fase 3 (React)
                </h2>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  1. Fidelidad al Wireframe y Jerarquía Visual (Fase 2)
                </h3>
                <p>
                  Se implementó la cuadrícula de <strong>3 columnas × 4 filas</strong> respetando el patrón de lectura
                  en F/Z: encabezado y filtros arriba, <strong>CO₂ per cápita</strong> destacado arriba a la izquierda
                  (Nivel 1), mapa coroplético mundial con fronteras reales (8 cols) + ranking ordenado (4 cols) en el
                  centro (Nivel 2), y serie histórica + dispersión logarítmica en la base[cite: 13].
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  2. Integración y Limpieza de Datos (Fase 1)
                </h3>
                <p>
                  El componente consume directamente <code>co2_data.json</code> preprocesado desde{' '}
                  <em>Our World in Data</em>, filtrando estrictamente códigos <strong>ISO-3</strong> (excluyendo
                  agregados como <code>OWID_WRL</code> o continentes), conservando los valores atípicos (outliers)
                  y renderizándolos mediante escala <strong>Log₁₀</strong> y filtro de población mínima[cite: 14, 15].
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  3. Coherencia Cromática y Data-Ink Ratio
                </h3>
                <p>
                  Paleta funcional de 4 colores (<code>#1E3A5F</code> Azul Pizarra, <code>#2A9D8F</code> Verde
                  Esmeralda, <code>#E9C46A</code> Ámbar y <code>#E76F51</code> Coral) diseñada para accesibilidad
                  (daltonismo) y máxima relación tinta-datos[cite: 13].
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: COLORS.slateBlue }}
              >
                Cerrar documentación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}