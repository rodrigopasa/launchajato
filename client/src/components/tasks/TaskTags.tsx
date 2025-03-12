import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XCircle, Plus, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { transitions } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface TaskTagsProps {
  initialTags?: string[];
  onChange?: (tags: string[]) => void;
  readonly?: boolean;
  className?: string;
  maxTags?: number;
}

const tagColors = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
  "bg-red-100 text-red-800",
  "bg-orange-100 text-orange-800",
];

export default function TaskTags({
  initialTags = [],
  onChange,
  readonly = false,
  className,
  maxTags = 10
}: TaskTagsProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);

  const getTagColor = (tag: string) => {
    // Generate a consistent color based on the tag name
    const index = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % tagColors.length;
    return tagColors[index];
  };

  const handleAddTag = () => {
    if (inputValue.trim() === "" || tags.length >= maxTags) return;
    
    const newTag = inputValue.trim();
    if (!tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      if (onChange) onChange(updatedTags);
    }
    
    setInputValue("");
    if (tags.length + 1 >= maxTags) {
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setShowInput(false);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    if (onChange) onChange(updatedTags);
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      <AnimatePresence>
        {tags.map(tag => (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transitions.quick}
          >
            <Badge className={cn("py-1 px-2", getTagColor(tag))}>
              <Tag className="h-3 w-3 mr-1" />
              {tag}
              {!readonly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 text-gray-600 hover:text-gray-900"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>

      {!readonly && (
        <>
          {showInput ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={transitions.quick}
              className="flex items-center gap-1"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nova tag..."
                className="h-8 min-w-[120px] max-w-[200px]"
                onBlur={() => inputValue === "" && setShowInput(false)}
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddTag}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            tags.length < maxTags && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInput(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar tag
                </Button>
              </motion.div>
            )
          )}
        </>
      )}
    </div>
  );
}