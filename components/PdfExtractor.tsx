"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, FileText, Edit, Save, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

interface PdfExtractorProps {
  file: File | null;
  onExtractedTextChange: (text: string) => void;
}

export function PdfExtractor({ file, onExtractedTextChange }: PdfExtractorProps) {
  const [extractedText, setExtractedText] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      
      // Clean up the URL when the component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);
  
  async function extractText() {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to extract text from.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExtracting(true);
    
    try {
      // Use the ConvertAPI via our backend API
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the new API endpoint
      const response = await fetch('/api/pdf-extractor', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to extract text from PDF");
      }
      
      const data = await response.json();
      setExtractedText(data.text);
      onExtractedTextChange(data.text);
      
      toast({
        title: "Text extracted",
        description: "Text has been successfully extracted from the PDF.",
      });
    } catch (error) {
      console.error("Error extracting text:", error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract text from PDF",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  }
  
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newText = e.target.value;
    setExtractedText(newText);
  }
  
  function saveEditedText() {
    onExtractedTextChange(extractedText);
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your changes to the extracted text have been saved.",
    });
  }
  
  function toggleEdit() {
    setIsEditing(!isEditing);
    
    // Focus the textarea when enabling edit mode
    if (!isEditing && textAreaRef.current) {
      setTimeout(() => {
        textAreaRef.current?.focus();
      }, 100);
    }
  }
  
  if (!file) {
    return (
      <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-center">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">No PDF file selected</p>
        <p className="text-gray-400 text-sm mt-1">Upload a PDF to extract its contents</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">PDF Extraction</h3>
          <p className="text-sm text-gray-500">{file.name}</p>
        </div>
        <div>
          <Button 
            onClick={extractText} 
            disabled={isExtracting || !file} 
            className="bg-black hover:bg-gray-800 text-white"
            size="sm"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...
              </>
            ) : (
              <>Extract Text</>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden h-[450px] border border-gray-200 shadow-soft">
          <CardContent className="p-4 h-full overflow-y-auto">
            {fileUrl ? (
              <div className="h-full flex items-center justify-center">
                <iframe 
                  src={fileUrl} 
                  className="w-full h-full" 
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex flex-col">
          <div className="hidden md:flex justify-center mb-2">
            <ArrowDown className="h-8 w-8 text-gray-300" />
          </div>
          <Card className="h-[450px] border border-gray-200 shadow-soft">
            <CardContent className="p-4 relative">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium">Extracted Text</h3>
                {extractedText && (
                  <Button 
                    onClick={toggleEdit}
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-3 hover:bg-gray-100"
                  >
                    {isEditing ? (
                      <><Save className="h-4 w-4 mr-2" /> Save</>
                    ) : (
                      <><Edit className="h-4 w-4 mr-2" /> Edit</>
                    )}
                  </Button>
                )}
              </div>
              
              {isExtracting ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 font-medium">Extracting text</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a moment...</p>
                  </div>
                </div>
              ) : extractedText ? (
                isEditing ? (
                  <div className="relative h-[350px]">
                    <Textarea
                      ref={textAreaRef}
                      value={extractedText}
                      onChange={handleTextChange}
                      className="h-full resize-none border-gray-200 focus:ring-gray-400 focus:ring-opacity-30"
                    />
                    <div className="absolute bottom-3 right-3">
                      <Button 
                        onClick={saveEditedText} 
                        size="sm" 
                        className="bg-black hover:bg-gray-800 text-white h-9"
                      >
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[350px] overflow-y-auto border border-gray-200 rounded-md p-4 text-sm bg-gray-50">
                    {extractedText}
                  </div>
                )
              ) : (
                <div className="h-[350px] flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium">Ready to Extract</p>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs text-center">
                    Click the "Extract Text" button to get text from your PDF
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 