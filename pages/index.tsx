import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SalesClassification = () => {
  const [classificationData, setClassificationData] = useState({
    S: [], A: [], B: [], C: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");

  const analyzeExcelData = async (excelData: Uint8Array) => {
    try {
      const workbook = XLSX.read(excelData, {
        cellStyles: true,
        cellDates: true,
        cellNF: true,
      });
  
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
  
      // Calculate total sales by practice
      const salesByPractice: { [key: string]: number } = {};
      jsonData.forEach((row: any) => {
        const practice = row.Practice;
        const sales = parseFloat(row.Sales || 0);
        if (practice) {
          salesByPractice[practice] = (salesByPractice[practice] || 0) + sales;
        }
      });
  
      // Sort practices by sales
      const sortedPractices = Object.entries(salesByPractice)
        .sort(([, a], [, b]) => b - a);
  
      const totalPractices = sortedPractices.length;
      const sClassCutoff = Math.floor(totalPractices * 0.1);
      const aClassCutoff = Math.floor(totalPractices * 0.3);
      const bClassCutoff = Math.floor(totalPractices * 0.6);
  
      // Classify practices
      const classification = {
        S: [] as { practice: string; sales: number; rank: number }[],
        A: [] as { practice: string; sales: number; rank: number }[],
        B: [] as { practice: string; sales: number; rank: number }[],
        C: [] as { practice: string; sales: number; rank: number }[],
      };
  
      sortedPractices.forEach(([practice, sales], index) => {
        const entry = {
          practice,
          sales: parseFloat(sales.toFixed(2)),
          rank: index + 1,
        };
  
        if (index < sClassCutoff) {
          classification.S.push(entry);
        } else if (index < aClassCutoff) {
          classification.A.push(entry);
        } else if (index < bClassCutoff) {
          classification.B.push(entry);
        } else {
          classification.C.push(entry);
        }
      });
  
      setClassificationData(classification);
      setError(null);
    } catch (error) {
      console.error('Error analyzing data:', error);
      setError('Error analyzing the Excel file. Please make sure it contains "Practice" and "Sales" columns.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/sales by product type by client_2024_10012025 1.xlsx');
        const data = await response.arrayBuffer();
        await analyzeExcelData(data);
        setFileName('sales by product type by client_2024_10012025 1.xlsx');
      } catch (error) {
        console.error('Error loading initial data:', error);
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        await analyzeExcelData(data);
      };
      reader.onerror = () => {
        setError('Error reading the file. Please try again.');
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const formatSales = (sales) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(sales);
  };

  const renderClassContent = (className, practices) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {practices.map((practice, index) => (
            <Card key={index} className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Rank #{practice.rank}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-2">{practice.practice}</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatSales(practice.sales)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sales Classification Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button className="flex items-center gap-2" onClick={() => document.getElementById('file-upload').click()}>
              <Upload size={16} />
              Import Excel File
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
            {fileName && (
              <p className="text-sm text-gray-600">
                Current file: {fileName}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Classification Criteria:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2"><span className="font-medium">Class S:</span> Top 10% of practices by sales volume</p>
                <p className="mb-2"><span className="font-medium">Class A:</span> Next 20% (Top 10-30%)</p>
              </div>
              <div>
                <p className="mb-2"><span className="font-medium">Class B:</span> Next 30% (Top 30-60%)</p>
                <p className="mb-2"><span className="font-medium">Class C:</span> Remaining 40% (Bottom 40%)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(classificationData).map(([className, practices]) => (
              <Card key={className} className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Class {className}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{practices.length}</p>
                  <p className="text-sm text-gray-600">practices</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center p-4">Processing data...</div>
      ) : (
        <Tabs defaultValue="S" className="w-full">
          <TabsList className="mb-4">
            {Object.keys(classificationData).map((className) => (
              <TabsTrigger key={className} value={className}>
                Class {className}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(classificationData).map(([className, practices]) => (
            <TabsContent key={className} value={className}>
              {renderClassContent(className, practices)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default SalesClassification;
