/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, JSX } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Papa from "papaparse";

// Define interfaces for our data types
interface ArtItem {
  id?: number;
  field_collection_type?: string;
  field_identifier?: string;
  title?: string;
  field_alternative_title?: string;
  artist?: string;
  field_genre?: string;
  field_date?: string;
  field_place_published?: string;
  field_description_long?: string;
  field_subject?: string;
  field_extent?: string;
  field_geographic_subject?: string;
  field_language?: string;
  field_classification?: string;
  field_physical_form?: string;
  // Some additional fields that might be in the full dataset
  field_place_published_objects?: string;
  field_genre_objects?: string;
  [key: string]: any; // For any other fields that might exist in the data
}

interface ChartDataItem {
  name: string;
  count: number;
}

type FeatureType =
  | "genre"
  | "classification"
  | "year"
  | "location"
  | "physical_form";
type ChartType = "bar" | "pie";

const ArtCollectionDashboard: React.FC = () => {
  const [data, setData] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureType>("genre");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);

  const COLORS = [
    "#123f77", // Deep blue (Van Gogh night sky)
    "#0f86b6", // Medium blue
    "#37cae5", // Light blue
    "#f5db37", // Golden yellow (Van Gogh stars)
    "#fbefcb", // Cream
    "#8f7834", // Ochre
    "#5a3a22", // Brown
    "#4a571e", // Dark olive
    "#d5a021", // Amber
    "#283618", // Dark green
  ];

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        // Using fetch instead of window.fs.readFile (Next.js compatible)
        const response = await fetch("/art_data.csv");

        if (!response.ok) {
          throw new Error(
            `Failed to fetch CSV: ${response.status} ${response.statusText}`
          );
        }

        const text = await response.text();

        Papa.parse<ArtItem>(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              setData(result.data);
              setLoading(false);
            } else {
              setError("No data found in the CSV file");
              setLoading(false);
            }
          },
          error: (err: any) => {
            setError(`Error parsing CSV: ${err.message}`);
            setLoading(false);
          },
        });
      } catch (err: any) {
        setError(`Error loading file: ${err.message}`);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      processData();
    }
  }, [data, selectedFeature]);

  const processData = (): void => {
    let processedData: ChartDataItem[] = [];

    switch (selectedFeature) {
      case "genre":
        processedData = processGenreData();
        break;
      case "classification":
        processedData = processClassificationData();
        break;
      case "year":
        processedData = processYearData();
        break;
      case "location":
        processedData = processLocationData();
        break;
      case "physical_form":
        processedData = processPhysicalFormData();
        break;
      default:
        processedData = processGenreData();
    }

    setChartData(processedData);
  };

  const processGenreData = (): ChartDataItem[] => {
    const genreCounts: Record<string, number> = {};

    data.forEach((item) => {
      if (item.field_genre) {
        const genre = item.field_genre;
        if (genreCounts[genre]) {
          genreCounts[genre]++;
        } else {
          genreCounts[genre] = 1;
        }
      }
    });

    // Convert to array and sort by count
    const sortedGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    return sortedGenres;
  };

  const processClassificationData = (): ChartDataItem[] => {
    const classificationCounts: Record<string, number> = {};

    data.forEach((item) => {
      if (item.field_classification) {
        const classification = item.field_classification;
        if (classificationCounts[classification]) {
          classificationCounts[classification]++;
        } else {
          classificationCounts[classification] = 1;
        }
      }
    });

    // Convert to array and sort by count
    const sortedClassifications = Object.entries(classificationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    return sortedClassifications;
  };

  const processYearData = (): ChartDataItem[] => {
    const decadeCounts: Record<string, number> = {};

    data.forEach((item) => {
      if (item.field_date) {
        // Extract year using regex to find first occurrence of 4 digits
        const yearMatch = String(item.field_date).match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0]);
          // Group into decades (1900s, 1910s, etc.)
          const decade = Math.floor(year / 10) * 10;
          const decadeLabel = `${decade}s`;

          if (decadeCounts[decadeLabel]) {
            decadeCounts[decadeLabel]++;
          } else {
            decadeCounts[decadeLabel] = 1;
          }
        }
      }
    });

    // Convert to array and sort by decade
    const sortedDecades = Object.entries(decadeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // Extract the decade number for sorting
        const decadeA = parseInt(a.name);
        const decadeB = parseInt(b.name);
        return decadeA - decadeB;
      });

    return sortedDecades;
  };

  const processLocationData = (): ChartDataItem[] => {
    const locationCounts: Record<string, number> = {};

    data.forEach((item) => {
      // Use field_place_published as the primary field, but fall back to field_place_published_objects if it exists in the full dataset
      const placeField =
        item.field_place_published || item.field_place_published_objects;

      if (placeField) {
        // Extract location (remove punctuation at the end like ":")
        let location = String(placeField)
          .replace(/\s*:\s*$/, "")
          .trim();

        // If it's a compound location, take the first part (e.g., "London" from "London :")
        if (location.includes(",")) {
          location = location.split(",")[0].trim();
        }

        if (locationCounts[location]) {
          locationCounts[location]++;
        } else {
          locationCounts[location] = 1;
        }
      }
    });

    // Convert to array and sort by count
    const sortedLocations = Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    return sortedLocations;
  };

  const processPhysicalFormData = (): ChartDataItem[] => {
    const formCounts: Record<string, number> = {};

    data.forEach((item) => {
      if (item.field_physical_form) {
        // Split by delimiters and take first meaningful part
        const form = String(item.field_physical_form)
          .split("|")[0]
          .split("--")[0]
          .trim();
        if (formCounts[form]) {
          formCounts[form]++;
        } else {
          formCounts[form] = 1;
        }
      }
    });

    // Convert to array and sort by count
    const sortedForms = Object.entries(formCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    return sortedForms;
  };

  // Original renderBarChart function with updated text color
  const renderBarChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fill: "#FFFFFF" }} // Changed from #fbefcb to #FFFFFF (white)
            interval={0}
            angle={-45}
            textAnchor="end"
            tickLine={{ stroke: "#FFFFFF" }} // Changed to white
            axisLine={{ stroke: "#FFFFFF" }} // Changed to white
          />
          <YAxis
            tick={{ fill: "#FFFFFF" }} // Changed from #fbefcb to #FFFFFF (white)
            tickLine={{ stroke: "#FFFFFF" }} // Changed to white
            axisLine={{ stroke: "#FFFFFF" }} // Changed to white
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#123f77",
              border: "1px solid #f5db37",
              color: "#FFFFFF", // Changed to white
            }}
            itemStyle={{ color: "#FFFFFF" }} // Changed to white
            labelStyle={{
              color: "#f5db37",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Legend wrapperStyle={{ color: "#FFFFFF" }} />
          <Bar
            dataKey="count"
            name="Number of Items"
            fill="#f5db37"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Original renderPieChart function with updated text color
  const renderPieChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={500}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={200}
            fill="#8884d8"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            labelLine={{ stroke: "#FFFFFF", strokeWidth: 1 }} // Changed to white
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#123f77"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#123f77",
              border: "1px solid #f5db37",
              color: "#FFFFFF", // Changed to white
            }}
            itemStyle={{ color: "#FFFFFF" }} // Changed to white
            labelStyle={{
              color: "#f5db37",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Legend
            wrapperStyle={{ color: "#FFFFFF" }} // Changed to white
            formatter={(value) => (
              <span style={{ color: "#FFFFFF" }}>{value}</span> // Changed to white
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Original renderYearChart function with updated text color
  const renderYearChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#FFFFFF" }} // Changed from default to white
            tickLine={{ stroke: "#FFFFFF" }} // Added white tick lines
            axisLine={{ stroke: "#FFFFFF" }} // Added white axis line
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "#FFFFFF" }} // Changed from #666 to white
            width={80}
            tickLine={{ stroke: "#FFFFFF" }} // Added white tick lines
            axisLine={{ stroke: "#FFFFFF" }} // Added white axis line
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#123f77",
              border: "1px solid #f5db37",
              color: "#FFFFFF",
            }}
            itemStyle={{ color: "#FFFFFF" }}
            labelStyle={{
              color: "#f5db37",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Legend wrapperStyle={{ color: "#FFFFFF" }} />
          <Bar dataKey="count" fill="#82ca9d" name="Number of Items" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const getChartTitle = (): string => {
    switch (selectedFeature) {
      case "genre":
        return "Top 10 Genres in the Collection";
      case "classification":
        return "Top 10 Classifications in the Collection";
      case "year":
        return "Publication Years Distribution";
      case "location":
        return "Top 10 Publication Locations";
      case "physical_form":
        return "Top 10 Physical Forms";
      default:
        return "Data Visualization";
    }
  };

  return (
    <div className="p-4 bg-gradient-to-b from-[#123f77] to-[#0f86b6] min-h-screen font-serif">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-[#fbefcb] tracking-wide">
            The Wolfsonian Art Collection
          </h1>
          <p className="text-[#f5db37] italic">
            Exploring the persuasive power of art and design
          </p>
        </header>

        {loading ? (
          <div className="text-center p-6 text-white">
            Loading the collection data...
          </div>
        ) : error ? (
          <div className="text-center p-6 text-red-300">{error}</div>
        ) : (
          <div>
            <div className="mb-6 bg-[#123f77]/60 backdrop-blur-sm rounded-lg shadow-lg border border-[#f5db37]/20 p-6">
              <h2 className="text-2xl font-semibold mb-4 text-[#f5db37]">
                Select Feature to Visualize
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedFeature("genre")}
                  className={`px-4 py-2 rounded-md border-2 transition-all ${
                    selectedFeature === "genre"
                      ? "bg-[#f5db37] text-[#123f77] border-[#f5db37] font-bold"
                      : "bg-transparent text-[#fbefcb] border-[#fbefcb]/50 hover:border-[#f5db37]"
                  }`}
                >
                  Genres
                </button>
                <button
                  onClick={() => setSelectedFeature("classification")}
                  className={`px-4 py-2 rounded-md border-2 transition-all ${
                    selectedFeature === "classification"
                      ? "bg-[#f5db37] text-[#123f77] border-[#f5db37] font-bold"
                      : "bg-transparent text-[#fbefcb] border-[#fbefcb]/50 hover:border-[#f5db37]"
                  }`}
                >
                  Classifications
                </button>
                <button
                  onClick={() => setSelectedFeature("year")}
                  className={`px-4 py-2 rounded-md border-2 transition-all ${
                    selectedFeature === "year"
                      ? "bg-[#f5db37] text-[#123f77] border-[#f5db37] font-bold"
                      : "bg-transparent text-[#fbefcb] border-[#fbefcb]/50 hover:border-[#f5db37]"
                  }`}
                >
                  Publication Years
                </button>
                <button
                  onClick={() => setSelectedFeature("location")}
                  className={`px-4 py-2 rounded-md border-2 transition-all ${
                    selectedFeature === "location"
                      ? "bg-[#f5db37] text-[#123f77] border-[#f5db37] font-bold"
                      : "bg-transparent text-[#fbefcb] border-[#fbefcb]/50 hover:border-[#f5db37]"
                  }`}
                >
                  Publication Locations
                </button>
                <button
                  onClick={() => setSelectedFeature("physical_form")}
                  className={`px-4 py-2 rounded-md border-2 transition-all ${
                    selectedFeature === "physical_form"
                      ? "bg-[#f5db37] text-[#123f77] border-[#f5db37] font-bold"
                      : "bg-transparent text-[#fbefcb] border-[#fbefcb]/50 hover:border-[#f5db37]"
                  }`}
                >
                  Physical Forms
                </button>
              </div>
            </div>

            <div className="bg-[#123f77]/60 backdrop-blur-sm rounded-lg shadow-lg border border-[#f5db37]/20 p-6">
              <div className="relative">
                <div className="absolute -top-14 -left-14 w-28 h-28 rounded-full bg-[#f5db37] opacity-40 blur-xl"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-[#37cae5] opacity-20 blur-xl"></div>

                <h2 className="text-2xl font-semibold mb-6 text-[#f5db37] relative z-10">
                  {getChartTitle()}
                </h2>

                <div className="flex justify-center gap-4 mb-6 relative z-10">
                  <button
                    onClick={() => setChartType("bar")}
                    className={`px-4 py-2 rounded-full transition-all ${
                      chartType === "bar"
                        ? "bg-[#f5db37] text-[#123f77] font-bold"
                        : "bg-[#fbefcb]/10 text-[#fbefcb] hover:bg-[#fbefcb]/20"
                    }`}
                  >
                    Bar Chart
                  </button>
                  <button
                    onClick={() => setChartType("pie")}
                    className={`px-4 py-2 rounded-full transition-all ${
                      chartType === "pie"
                        ? "bg-[#f5db37] text-[#123f77] font-bold"
                        : "bg-[#fbefcb]/10 text-[#fbefcb] hover:bg-[#fbefcb]/20"
                    }`}
                  >
                    Pie Chart
                  </button>
                </div>

                <div className="relative z-10 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                  {chartData.length > 0 ? (
                    selectedFeature === "year" ? (
                      renderYearChart()
                    ) : chartType === "pie" ? (
                      renderPieChart()
                    ) : (
                      renderBarChart()
                    )
                  ) : (
                    <div className="text-center p-6 text-[#fbefcb]">
                      No data available for this feature
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="text-center mt-8 text-[#fbefcb]/70 text-sm italic">
              Inspired by the collections at The Wolfsonian–FIU, a museum that
              illustrates the persuasive power of art and design
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtCollectionDashboard;
