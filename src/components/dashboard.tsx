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
  Label,
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
  | "physical_form"
  | "language"
  | "subject";
type ChartType = "bar" | "pie";

const ArtCollectionDashboard: React.FC = () => {
  const [data, setData] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureType>("genre");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);

  const COLORS = [
    "#000000", // Black
    "#282828", // Very dark gray
    "#424242", // Dark gray
    "#464646", // Dark gray (slightly lighter)
    "#646464", // Medium gray
    "#898989", // Gray
    "#929292", // Light gray
    "#B0B0B0", // Lighter gray
    "#D4D4D4", // Very light gray
    "#E9E9E9", // Off-white
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
      case "language":
        processedData = processLanguageData();
        break;
      case "subject":
        processedData = processSubjectData();
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

    // Convert to array and sort by count (instead of decade)
    const sortedDecades = Object.entries(decadeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count) // Sort by count in descending order
      .slice(0, 10) // Get only top 10
      .filter((item) => item.name && !isNaN(item.count) && item.count > 0);

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

  // New function to process language data
  const processLanguageData = (): ChartDataItem[] => {
    const languageCounts: Record<string, number> = {};

    data.forEach((item) => {
      if (item.field_language) {
        // Handle possible multiple languages separated by delimiters
        const languages = String(item.field_language).split(/[|;,]/);

        languages.forEach((lang) => {
          const cleanedLang = lang.trim();
          if (cleanedLang) {
            if (languageCounts[cleanedLang]) {
              languageCounts[cleanedLang]++;
            } else {
              languageCounts[cleanedLang] = 1;
            }
          }
        });
      }
    });

    // Convert to array and sort by count
    const sortedLanguages = Object.entries(languageCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    return sortedLanguages;
  };

  // New function to process subject data
  const processSubjectData = (): ChartDataItem[] => {
    const subjectCounts: Record<string, number> = {};

    data.forEach((item) => {
      if (item.field_subject) {
        // Handle possible multiple subjects separated by delimiters
        const subjects = String(item.field_subject).split(/[|;,]/);

        subjects.forEach((subject) => {
          const cleanedSubject = subject.trim();
          if (cleanedSubject) {
            if (subjectCounts[cleanedSubject]) {
              subjectCounts[cleanedSubject]++;
            } else {
              subjectCounts[cleanedSubject] = 1;
            }
          }
        });
      }
    });

    // Convert to array and sort by count
    const sortedSubjects = Object.entries(subjectCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10

    return sortedSubjects;
  };

  // Original renderBarChart function with updated text color
  const renderBarChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={600}>
        <BarChart
          data={chartData}
          margin={{ top: 50, right: 30, left: 20, bottom: 150 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fill: "#000000" }} // Changed from #fbefcb to #FFFFFF (white)
            interval={0}
            angle={-45}
            textAnchor="end"
            tickLine={{ stroke: "#000000" }} // Changed to white
            axisLine={{ stroke: "#000000" }} // Changed to white
          />
          <YAxis
            tick={{ fill: "#000000" }} // Changed from #fbefcb to #FFFFFF (white)
            tickLine={{ stroke: "#000000" }} // Changed to white
            axisLine={{ stroke: "#000000" }} // Changed to white
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#000000",
              border: "1px solid #FFFFFF",
              color: "#000000", // Changed to white
            }}
            itemStyle={{ color: "#FFFFFF" }} // Changed to white
            labelStyle={{
              color: "#FFFFFF",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Legend wrapperStyle={{ color: "#000000" }} />
          <Bar
            dataKey="count"
            name="Number of Items"
            fill="##FF0000"
            radius={[0, 0, 0, 0]}
            legendType="none"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Original renderPieChart function with updated text color
  const renderPieChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={600}>
        <PieChart
          margin={{ top: 0, right: 40, bottom: 50, left: 40 }}
          >
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={180}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            labelLine={{ strokeWidth: 1 }} // Changed to white
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="#000000"
                stroke="#FFFFFF"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#000000",
              border: "1px solid #FFFFFF",
              color: "#FFFFFF", // Changed to white
            }}
            itemStyle={{ color: "#FFFFFF" }} // Changed to white
            labelStyle={{
              color: "#FFFFFF",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Legend
            wrapperStyle={{ color: "#000000" }} // Changed to white
            formatter={(value) => (
              <span style={{ color: "#000000" }}>{value}</span> // Changed to white
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Original renderYearChart function with updated text color
  const renderYearChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={600}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 30, left: 100, bottom: 100 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#000000" }} // Changed from default to white
            tickLine={{ stroke: "#000000" }} // Added white tick lines
            axisLine={{ stroke: "#000000" }} // Added white axis line
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "#000000" }} // Changed from #666 to white
            width={80}
            tickLine={{ stroke: "#000000" }} // Added white tick lines
            axisLine={{ stroke: "#000000" }} // Added white axis line
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#000000",
              border: "1px solid #FFFFFF",
              color: "#FFFFFF", // Changed to white
            }}
            itemStyle={{ color: "#FFFFFF" }} // Changed to white
            labelStyle={{
              color: "#FFFFFF",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Legend wrapperStyle={{ color: "#FFFFFF" }} />
          <Bar
            dataKey="count"
            fill="#000000"
            name="Number of Items"
            legendType="none"
          />
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
        return "Top 10 Publication Dates in the Collection";
      case "location":
        return "Top 10 Geographic Origins of the Collection";
      case "physical_form":
        return "Top 10 Physical Materials in the Collection";
      case "language":
        return "Top 10 Languages in the Collection";
      case "subject":
        return "Top 10 Subjects in the Collection";
      default:
        return "Data Visualization";
    }
  };

  const getChartDescription = (): string => {
    switch (selectedFeature) {
      case "genre":
        return "Top 10 Genres in the Collection Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      case "classification":
        return "Top 10 Classifications in the Collection Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      case "year":
        return "Top 10 Publication Dates in the Collection Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      case "location":
        return "Top 10 Geographic Origins of the Collection Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      case "physical_form":
        return "Top 10 Physical Materials in the Collection Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      case "language":
        return "Top 10 Languages in the Collection Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      case "subject":
        return "Top 10 Subjects in the Collection Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      default:
        return "Data Visualization";
    }
  };

  return (
    <div className="font-[Roboto] min-h-screen">
      <div className="bg-black w-screen h-50 p-4 mb-12">
        <header className="my-12 text-left max-w-6xl mx-auto">
          <h1 className="text-5xl font-medium mb-2 text-white tracking-wide">
            The Wolfsonian Art Collection
          </h1>
          <p className="text-white">
            EXPLORING THE PERSUASIVE POWER OF ART AND DESIGN
          </p>
        </header>
      </div>
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center p-6 text-white">
            Loading the collection data...
          </div>
        ) : error ? (
          <div className="text-center p-6 text-red-300">{error}</div>
        ) : (
          <div>
            <div className="mb-12">
              <h2 className="text-3xl font-medium mb-4">
                Explore our collection by the numbers
              </h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat
              </p>
            </div>
            <div className="grid grid-cols-[1fr_3fr] gap-x-[6%] gap-y-0">
              <div className="block">
                <h3 className="text-xl font-bold">Selected Facets</h3>
                <hr className="h-px bg-gray-200 border-0 mt-2 mb-4"></hr>
                <div className="space-y-3">
                  {[
                    { label: "Genres", value: "genre" },
                    { label: "Classifications", value: "classification" },
                    { label: "Publication Dates", value: "year" },
                    { label: "Geographic Origins", value: "location" },
                    { label: "Materials", value: "physical_form" },
                    { label: "Languages", value: "language" },
                    { label: "Subjects", value: "subject" },
                  ].map((facet) => (
                    <label
                      key={facet.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="accent-black h-4 w-4"
                        checked={selectedFeature === facet.value}
                        onChange={() =>
                          setSelectedFeature(
                            selectedFeature === facet.value
                              ? null
                              : (facet.value as FeatureType)
                          )
                        }
                      />
                      <span
                        className={`text-lg ${
                          selectedFeature === facet.value
                            ? "font-medium text-black"
                            : "text-gray-700"
                        }`}
                      >
                        {facet.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="">
                <div className="relative">
                  <h2 className="text-2xl font-semibold mb-4 relative">
                    {getChartTitle()}
                  </h2>
                  <p className="mb-6 relative">{getChartDescription()}</p>

                  <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
                    <ul className="flex flex-wrap -mb-px">
                      <li className="me-2">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent page scroll
                            setChartType("bar");
                          }}
                          className={`inline-block p-4 border-b-2 rounded-t-lg transition-all ${
                            chartType === "bar"
                              ? "text-black text-base font-semibold"
                              : "text-gray-500 text-base border-transparent hover:text-gray-600 hover:border-gray-300"
                          }`}
                          aria-current={
                            chartType === "bar" ? "page" : undefined
                          }
                        >
                          Bar Chart
                        </a>
                      </li>
                      <li className="me-2">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent page scroll
                            setChartType("pie");
                          }}
                          className={`inline-block p-4 border-b-2 rounded-t-lg transition-all ${
                            chartType === "pie"
                              ? "text-black text-base font-semibold"
                              : "text-gray-500 text-base border-transparent hover:text-gray-600 hover:border-gray-300"
                          }`}
                          aria-current={
                            chartType === "pie" ? "page" : undefined
                          }
                        >
                          Pie Chart
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div className="relative">
                    {chartData.length > 0 ? (
                      selectedFeature === "year" && chartType === "bar" ? (
                        renderYearChart()
                      ) : selectedFeature === "year" && chartType === "pie" ? (
                        renderPieChart() // The pie chart should be able to handle year data
                      ) : chartType === "pie" ? (
                        renderPieChart()
                      ) : (
                        renderBarChart()
                      )
                    ) : (
                      <div className="text-center p-6">
                        No data available for this feature
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <footer className="text-center mt-8 text-gray-400 text-sm italic mb-4">
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
