/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, JSX } from "react";
import Image from "next/image";
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
    "#2C3E50", // Dark blue/slate
    "#7F8C8D", // Medium gray with blue undertone
    "#34495E", // Darker blue/slate
    "#8E44AD", // Dark purple
    "#2980B9", // Medium blue
    "#16A085", // Teal
    "#27AE60", // Dark green
    "#F39C12", // Orange
    "#C0392B", // Dark red
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
          if (year < 2025) {
            const decade = Math.floor(year / 10) * 10;
            const decadeLabel = `${decade}s`;

            if (decadeCounts[decadeLabel]) {
              decadeCounts[decadeLabel]++;
            } else {
              decadeCounts[decadeLabel] = 1;
            }
          }
        }
      }
    });

    // Convert to array and sort by decade (chronologically) instead of count
    const sortedDecades = Object.entries(decadeCounts)
      .map(([name, count]) => ({ name, count }))
      .filter((item) => item.name && !isNaN(item.count) && item.count > 0)
      .sort((a, b) => {
        // Extract the numeric part of the decade label for sorting
        const decadeA = parseInt(a.name);
        const decadeB = parseInt(b.name);
        return decadeA - decadeB; // Sort in ascending order
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

  const renderPieChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={700}>
        <PieChart margin={{ top: 0, right: 40, bottom: 50, left: 40 }}>
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
            labelLine={{ stroke: "#000000", strokeWidth: 1 }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#FFFFFF"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #000000",
              color: "#000000",
            }}
            itemStyle={{ color: "#000000" }}
            labelStyle={{
              color: "#000000",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          {/* Legend has been removed */}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={700}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#000000", fontSize: 12 }}
            interval={0}
            angle={-65} // Steeper angle for labels
            textAnchor="end"
            tickLine={{ stroke: "#000000" }}
            axisLine={{ stroke: "#000000" }}
            height={150} // Much larger height for x-axis
          />
          <YAxis
            tick={{ fill: "#000000" }}
            tickLine={{ stroke: "#000000" }}
            axisLine={{ stroke: "#000000" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #000000",
              color: "#000000",
            }}
            itemStyle={{ color: "#000000" }}
            labelStyle={{
              color: "#000000",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Bar
            dataKey="count"
            name="Number of Items"
            fill={COLORS[0]}
            radius={[0, 0, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Original renderYearChart function with updated fill color
  const renderYearChart = (): JSX.Element => {
    return (
      <ResponsiveContainer width="100%" height={700}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 30, left: 100, bottom: 100 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#000000" }}
            tickLine={{ stroke: "#000000" }}
            axisLine={{ stroke: "#000000" }}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "#000000" }}
            width={80}
            tickLine={{ stroke: "#000000" }}
            axisLine={{ stroke: "#000000" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #000000",
              color: "#000000",
            }}
            itemStyle={{ color: "#000000" }}
            labelStyle={{
              color: "#000000",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          />
          <Legend wrapperStyle={{ color: "#000000" }} />
          <Bar
            dataKey="count"
            name="Number of Items"
            fill={COLORS[0]} // Using the first color from the COLORS array
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  function getFacetContent(selectedFeature) {
    switch (selectedFeature) {
      case "genre":
        return {
          image: "/images/Genre-Magic Dials.jpg",
          link: "https://digital.wolfsonian.org/WOLF072308",
          description: (
            <div className="text-xs">
              Book,{" "}
              <span className="font-bold italic">
                Magic dials: the story of radio and television
              </span>
              , 1939
              <br />
              Lowell Thomas (American, 1892–1981)
              <br />
              New York
              <br />
              Illustrations (some color), Front Piece Portrait
              <br />
              The Wolfsonian–FIU, The Mitchell Wolfson, Jr. Collection,
              XB1990.1367
            </div>
          ),
        };
      case "classification":
        return {
          image: "/images/Classification-LeBalcon.jpg",
          link: "https://digital.wolfsonian.org/WOLF015320",
          description: (
            <div className="text-xs">
              Painting, <span className="font-bold italic">Le Balcon</span> [The
              Balcony], 1923
              <br />
              Henry Meylan (Swiss, 1895-1980)
              <br />
              Switzerland Geneva
              <br />
              Fine Arts, Oil on Canvas
              <br />
              The Wolfsonian–FIU, The Mitchell Wolfson, Jr. Collection,
              TD1990.285.3
            </div>
          ),
        };
      case "year":
        return {
          image: "/images/Date-Shubert Theatre.jpg",
          link: "https://digital.wolfsonian.org/WOLF031948",
          description: (
            <div className="text-xs">
              Poster,{" "}
              <span className="font-bold italic">
                Sam S. Shubert Theatre :44th Street, west of Broadway
              </span>
              , 1930 (year approximate)
              <br />
              Shubert Theatre Corp.
              <br />
              New York
              <br />
              Ink
              <br className="text-gray-600" />
              The Wolfsonian–FIU, The Mitchell Wolfson, Jr. Collection,
              XC2005.08.1.15
            </div>
          ),
        };
      case "location":
        return {
          image: "/images/Location-The Architect.jpg",
          link: "https://digital.wolfsonian.org/WOLF080965",
          description: (
            <div className="text-xs">
              Poster,{" "}
              <span className="font-bold italic">
                The Architect & The Industrial Arts
              </span>
              , 1930 (year approximate)
              <br />
              Unknown Artist
              <br />
              New York
              <br />
              Ink
              <br />
              The Wolfsonian–FIU, The Mitchell Wolfson, Jr. Collection,
              WC2004.12.35.1
            </div>
          ),
        };
      case "physical_form":
        return {
          image: "/images/Materials-Kay Harshberger.jpg",
          link: "https://digital.wolfsonian.org/WOLF014299",
          description: (
            <div className="text-xs">
              Print, <span className="font-bold italic">Kay Harshberger</span>,
              Date Unknown
              <br />
              Frank MacCoy (Mac) Harshberger Jr. (American, 1901, 1975)
              <br />
              Great Britain
              <br />
              Ink on paper block
              <br />
              The Wolfsonian–FIU, The Mitchell Wolfson, Jr. Collection,
              TD1989.42.2
            </div>
          ),
        };
      case "language":
        return {
          image: "/images/Language-Army Book.jpg",
          link: "https://digital.wolfsonian.org/WOLF078031",
          description: (
            <div className="text-xs">
              Diary,{" "}
              <span className="font-bold italic">
                Reminiscence of a soldier
              </span>
              , 1872 (year approximate)
              <br />
              Unknown
              <br />
              England
              <br />
              Manuscript
              <br />
              The Wolfsonian–FIU, The Mitchell Wolfson, Jr. Collection,
              XC2012.08.1.462
            </div>
          ),
        };
      case "subject":
        return {
          image: "/images/Subject-Untitled.jpg",
          link: "https://digital.wolfsonian.org/WOLF023625",
          description: (
            <div className="text-xs">
              Textile,{" "}
              <span className="font-bold italic">
                Untitled [Possible textile design with floral motif]
              </span>
              , Date Unknown
              <br />
              Artur Lakatos (Hungarian, 1880-1968)
              <br />
              Hungary
              <br />
              Gouache, watercolor and graphite on paper
              <br />
              The Wolfsonian–FIU, The Mitchell Wolfson, Jr. Collection,
              TD1995.2.14
            </div>
          ),
        };
      default:
        return null;
    }
  }

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
        return "This visualization highlights the predominant art and design genres in the Wolfsonian collection. Genres represent the categories of artistic expression, such as propaganda, advertising, architectural design, and illustration. These classifications help reveal how art and design were used to communicate ideas across different periods. The predominance of certain genres reflects the museum's focus on objects that demonstrate the persuasive power of art and design.";
      case "classification":
        return "Classifications categorize items by their fundamental type or purpose, showing the range of creative works in the collection. This includes fine arts (paintings, sculptures), decorative arts (furniture, ceramics), graphic design, architectural drawings, and industrial design. The distribution reveals the Wolfsonian's distinctive focus on the intersection of art, design, and propaganda during the modern era.";
      case "year":
        return "This chart displays the chronological distribution of the collection by decade, arranged in historical sequence (not by quantity). While the collection spans from the late 19th century to 2025, the Wolfsonian has a particular focus on the period from 1885 to 1945 - the height of the industrial age through World War II. This core timeframe represents a critical period when design and propaganda became powerful tools for social and political transformation, reflecting the museum's mission to explore how design shapes and reflects human experience. Any items with dates beyond the current year have been excluded as they likely represent cataloging errors.";
      case "location":
        return "Geographic origins show where items in the collection were created, highlighting the Wolfsonian's international scope. The distribution reveals the museum's focus on major centers of design innovation and propaganda production during the industrial age and wartime periods. This geographic diversity helps visitors understand how different cultures used art and design as tools of persuasion and national identity during pivotal historical moments.";
      case "physical_form":
        return "Materials and physical forms reveal the diverse media used by artists and designers represented in the collection. From traditional materials like paper, wood, and metal to innovative industrial materials of the modern era, these categories demonstrate how creators adapted their techniques to new manufacturing processes. The prevalence of certain materials reflects both artistic trends and the technological capabilities of different periods.";
      case "language":
        return "Language distribution in the collection reveals both the international scope of the Wolfsonian and the global influence of different cultures during the modern era. Printed materials, books, posters, and ephemera in various languages demonstrate how art and propaganda transcended national boundaries. This linguistic diversity helps contextualize the global conversations and conflicts that shaped design movements across borders.";
      case "subject":
        return "Subject matter categories reveal the thematic focus of works in the collection, from political movements and industrial progress to social change and cultural identity. These subjects reflect the Wolfsonian's emphasis on how art and design were used to persuade and influence across different spheres of human activity. The prevalence of certain themes helps visitors understand the major concerns and aspirations of societies during periods of rapid transformation.";
      default:
        return "Data Visualization";
    }
  };

  return (
    <div className="font-[Roboto] min-h-screen">
      <div className="bg-black w-screen h-40 p-4 mb-10">
        <header className="my-6 text-left max-w-6xl mx-auto flex flex-col">
          <div>
            <img
              src="./fiu_wolfsonian_logo.png"
              width="300"
              height="125"
              alt="FIU Wolfsonian"
            />
          </div>
          <nav className="flex flex-row text-white text-lg uppercase gap-x-8 pt-4">
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/">Home</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/visit/">Visit</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/whats-on/">What&apos;s On</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/youth+family/">Youth + Family</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/research/">Research</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/fiu/">FIU</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/blog/">Blog</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/join-give/">Join + Give</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/expansion/">Expansion</a>
            </h2>
            <h2 className="hover:cursor-pointer hover:underline">
              <a href="https://wolfsonian.org/about/">About</a>
            </h2>
          </nav>
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
            <div className="mb-16">
              <h2 className="text-3xl font-medium mb-4">
                Explore our collection by the numbers
              </h2>
              <p>
                Florida International University computer science students
                developed this digital visualization platform for{" "}
                <a className="font-bold" href="https://wolfsonian.org/">
                  the Wolfsonian–FIU
                </a>{" "}
                as their Capstone project. The platform lets visitors explore
                the museum&apos;s collection by visualizing it across genres,
                classifications, publication dates, geographic origins,
                materials, languages, and subjects. Through this interactive
                tool, users gain insights into our focus areas. It transforms
                complex collections data into accessible information and shows
                how visual representation can illuminate large collections.
              </p>
            </div>
            <div className="grid grid-cols-[1fr_3fr] gap-x-[6%] gap-y-0">
              <div className="block">
                <h3 className="text-xl font-bold">Selected Facets</h3>
                <hr className="h-px bg-gray-200 border-0 mt-2 mb-4"></hr>
                <div className="space-y-3 m">
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
                        className={`text-base ${
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
                <div className="mt-6">
                  <h3 className="text-xl font-bold">Featured Item</h3>
                  <hr className="h-px bg-gray-200 border-0 mt-2 mb-4"></hr>
                  {(() => {
                    const content = getFacetContent(selectedFeature);
                    if (content) {
                      return (
                        <>
                          <a href={content.link} target="_blank">
                            <img
                              src={content.image}
                              alt="Featured Item"
                              className="w-full h-auto mb-4"
                            />
                          </a>
                          <div>{content.description}</div>
                        </>
                      );
                    } else {
                      return <p>No featured item for this selection.</p>;
                    }
                  })()}
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
