'use client';

import type { ChatRequestOptions, CreateMessage, Message } from 'ai';
import type React from 'react';
import { useRef, useEffect, useState, useCallback, type Dispatch, type SetStateAction, type ChangeEvent, memo } from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { sanitizeUIMessages } from '@/lib/utils';

import {
  ArrowUp,
  X,
  Square,
  Globe,
  LayoutGrid,
  Code,
  MessageCircle,
  Image,
  Video,
  Brain,
  Flame,
  Upload,
  Mountain,
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
import equal from 'fast-deep-equal';
import { UseChatHelpers } from '@ai-sdk/react';

// Define Attachment interface with size
interface Attachment {
  name: string;
  contentType: string;
  url: string;
  size: number;
}

// Define UploadingAttachment interface with name
interface UploadingAttachment {
  file: File;
  progress: number;
  name: string; // Added name property
}

// Define SearchGroup and SearchGroupId types
type SearchGroupId = 'web' | 'grid' | 'x' | 'code' | 'chat' | 'image' | 'video' | 'grok' | 'extreme';

interface SearchGroup {
  id: SearchGroupId;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
}

const searchGroups: SearchGroup[] = [
  { id: 'web', name: 'Web', description: 'Search the web', icon: Globe, show: true },
  { id: 'grid', name: 'Grid', description: 'Grid view', icon: LayoutGrid, show: true },
  { id: 'x', name: 'X', description: 'Search X platform', icon: X, show: true },
  { id: 'code', name: 'Code', description: 'Code search', icon: Code, show: true },
  { id: 'chat', name: 'Chat', description: 'Chat mode', icon: MessageCircle, show: true },
  { id: 'image', name: 'Image', description: 'Image search', icon: Image, show: true },
  { id: 'video', name: 'Video', description: 'Video search', icon: Video, show: true },
  { id: 'grok', name: 'Grok 2.0', description: 'Grok 2.0 mode', icon: Brain, show: true },
  { id: 'extreme', name: 'Extreme', description: 'Extreme mode', icon: Flame, show: true },
];

// Model Switcher Data
const models = [
  { value: "scira-default", label: "Grok 2.0", icon: Brain, iconClass: "!text-neutral-300", description: "xAI's Grok 2.0 model", color: "glossyblack", vision: false, experimental: false, category: "Stable" },
  { value: "scira-vision", label: "Grok 2.0 Vision", icon: Brain, iconClass: "!text-neutral-300", description: "xAI's Grok 2.0 Vision model", color: "steel", vision: true, experimental: false, category: "Stable" },
];

const getColorClasses = (color: string, isSelected: boolean = false) => {
  const baseClasses = "transition-colors duration-200";
  const selectedClasses = isSelected ? "!bg-opacity-100 dark:!bg-opacity-100" : "";

  switch (color) {
    case 'glossyblack':
      return isSelected
        ? `${baseClasses} ${selectedClasses} !bg-[#4D4D4D] dark:!bg-[#3A3A3A] !text-white hover:!bg-[#3D3D3D] dark:hover:!bg-[#434343] !border-[#4D4D4D] dark:!border-[#3A3A3A] !ring-[#4D4D4D] dark:!ring-[#3A3A3A] focus:!ring-[#4D4D4D] dark:focus:!ring-[#3A3A3A]`
        : `${baseClasses} !text-[#4D4D4D] dark:!text-[#E5E5E5] hover:!bg-[#4D4D4D] hover:!text-white dark:hover:!bg-[#3A3A3A] dark:hover:!text-white`;
    case 'steel':
      return isSelected
        ? `${baseClasses} ${selectedClasses} !bg-[#4B82B8] dark:!bg-[#4A7CAD] !text-white hover:!bg-[#3B6C9D] dark:hover:!bg-[#3A6C9D] !border-[#4B82B8] dark:!border-[#4A7CAD] !ring-[#4B82B8] dark:!ring-[#4A7CAD] focus:!ring-[#4B82B8] dark:focus:!ring-[#4A7CAD]`
        : `${baseClasses} !text-[#4B82B8] dark:!text-[#A7C5E2] hover:!bg-[#4B82B8] hover:!text-white dark:hover:!bg-[#4A7CAD] dark:hover:!text-white`;
    default:
      return isSelected
        ? `${baseClasses} ${selectedClasses} !bg-neutral-500 dark:!bg-neutral-700 !text-white hover:!bg-neutral-600 dark:hover:!bg-neutral-800 !border-neutral-500 dark:!border-neutral-700`
        : `${baseClasses} !text-neutral-600 dark:!text-neutral-300 hover:!bg-neutral-500 hover:!text-white dark:hover:!bg-neutral-700 dark:hover:!text-white`;
  }
};

// Model Switcher Component
interface ModelSwitcherProps {
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  className?: string;
  showExperimentalModels: boolean;
  attachments: Array<Attachment>;
  messages: Array<Message>;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ selectedModel, setSelectedModel, className, showExperimentalModels, attachments, messages, status }) => {
  const selectedModelData = models.find(model => model.value === selectedModel);
  const [isOpen, setIsOpen] = useState(false);
  const isProcessing = status === 'submitted' || status === 'streaming';

  const hasAttachments = attachments.length > 0 || messages.some(msg =>
    msg.experimental_attachments && msg.experimental_attachments.length > 0
  );

  const filteredModels = hasAttachments
    ? models.filter(model => model.vision)
    : models.filter(model => showExperimentalModels ? true : !model.experimental);

  const groupedModels = filteredModels.reduce((acc, model) => {
    const category = model.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-2 sm:px-3 h-8",
          "rounded-full transition-all duration-300",
          "border border-neutral-200 dark:border-neutral-800",
          "hover:shadow-md",
          getColorClasses(selectedModelData?.color || "neutral", true),
          isProcessing && "opacity-50 pointer-events-none",
          className
        )}
        disabled={isProcessing}
      >
        {selectedModelData && (
          <selectedModelData.icon
            className={cn(
              "w-3.5 h-3.5",
              selectedModelData.iconClass
            )}
          />
        )}
        <span className="hidden sm:block text-xs font-medium overflow-hidden">
          {selectedModelData?.label || ""}
        </span>
      </button>
      {isOpen && !isProcessing && (
        <div
          className="absolute w-[220px] p-1 !font-sans rounded-lg bg-white dark:bg-neutral-900 sm:ml-4 !mt-1.5 sm:m-auto !z-[52] shadow-lg border border-neutral-200 dark:border-neutral-800"
        >
          {Object.entries(groupedModels).map(([category, categoryModels], categoryIndex) => (
            <div key={category} className={cn(categoryIndex > 0 && "mt-1")}>
              <div className="px-2 py-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 select-none">
                Models
              </div>
              <div className="space-y-0.5">
                {categoryModels.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => {
                      setSelectedModel(model.value.trim());
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs w-full text-left",
                      "transition-all duration-200",
                      "hover:shadow-sm",
                      getColorClasses(model.color, selectedModel === model.value)
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-md",
                      selectedModel === model.value
                        ? "bg-black/10 dark:bg-white/10"
                        : "bg-black/5 dark:bg-white/5",
                      "group-hover:bg-black/10 dark:group-hover:bg-white/10"
                    )}>
                      <model.icon
                        className={cn(
                          "w-3 h-3",
                          model.iconClass
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-px min-w-0">
                      <div className="font-medium truncate">{model.label}</div>
                      <div className="text-[10px] opacity-80 truncate leading-tight">{model.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Character Counter Component
const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
  const percentage = Math.min(100, (current / max) * 100);
  const isNearLimit = percentage >= 80 && percentage < 100;
  const isOverLimit = percentage >= 100;

  const strokeColor = isOverLimit
    ? 'stroke-red-500'
    : isNearLimit
      ? 'stroke-amber-500'
      : 'stroke-neutral-400';

  const size = 16;
  const strokeWidth = 1.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage * circumference) / 100;
  const gap = circumference - dash;

  const bgColor = isOverLimit
    ? 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
    : isNearLimit
      ? 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700';

  return (
    <div className={`relative flex items-center justify-center ${bgColor} rounded-full shadow-sm transition-all duration-200`}>
      <svg height={size} width={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        {current > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-neutral-200 dark:stroke-neutral-700"
          />
        )}
        {current > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            className={`transition-all ${strokeColor}`}
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

// Attachment Preview Component
const AttachmentPreview: React.FC<{ attachment: Attachment | UploadingAttachment, onRemove: () => void, isUploading: boolean }> = ({ attachment, onRemove, isUploading }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const isUploadingAttachment = (attachment: Attachment | UploadingAttachment): attachment is UploadingAttachment => {
    return 'progress' in attachment;
  };

  const truncateFilename = (filename: string, maxLength: number = 20) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const name = filename.substring(0, maxLength - 4);
    return `${name}...${extension}`;
  };

  // Use attachment.name for Attachment, and attachment.file.name for UploadingAttachment
  const attachmentName = isUploadingAttachment(attachment) ? attachment.name : attachment.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="relative flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 pr-8 gap-2 shadow-sm flex-shrink-0 z-0"
    >
      {isUploading ? (
        <div className="w-10 h-10 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-neutral-500 dark:text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : isUploadingAttachment(attachment) ? (
        <div className="w-10 h-10 flex items-center justify-center">
          <div className="relative w-8 h-8">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-neutral-300 dark:text-neutral-600 stroke-current"
                strokeWidth="10"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              ></circle>
              <circle
                className="text-primary stroke-current"
                strokeWidth="10"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                strokeDasharray={`${attachment.progress * 251.2}, 251.2`}
                transform="rotate(-90 50 50)"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{Math.round(attachment.progress * 100)}%</span>
            </div>
          </div>
        </div>
      ) : (
        <img
          src={(attachment as Attachment).url}
          alt={`Preview of ${attachmentName}`}
          width={40}
          height={40}
          className="rounded-lg h-10 w-10 object-cover"
        />
      )}
      <div className="flex-grow min-w-0">
        {!isUploadingAttachment(attachment) && (
          <p className="text-sm font-medium truncate text-neutral-800 dark:text-neutral-200">
            {truncateFilename(attachmentName)}
          </p>
        )}
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {isUploadingAttachment(attachment)
            ? 'Uploading...'
            : formatFileSize((attachment as Attachment).size)}
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute -top-2 -right-2 p-0.5 m-0 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors z-20"
      >
        <X className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
      </motion.button>
    </motion.div>
  );
};

// Group Selector Component
interface GroupSelectorProps {
  selectedGroup: SearchGroupId;
  onGroupSelect: (group: SearchGroup) => void;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  onExpandChange?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ToolbarButtonProps {
  group: SearchGroup;
  isSelected: boolean;
  onClick: () => void;
}

const ToolbarButton = ({ group, isSelected, onClick }: ToolbarButtonProps) => {
  const Icon = group.icon;
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  const commonClassNames = cn(
    "relative flex items-center justify-center",
    "size-8",
    "rounded-full",
    "transition-colors duration-300",
    isSelected
      ? "bg-neutral-500 dark:bg-neutral-600 text-white dark:text-neutral-300"
      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();

    if (isMobile) {
      toast(`Switched to ${group.name}: ${group.description}`, {
        duration: 2000,
      });
    }
  };

  if (isMobile) {
    return (
      <button
        onClick={handleClick}
        className={commonClassNames}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Icon className="size-4" />
      </button>
    );
  }

  const button = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={commonClassNames}
    >
      <Icon className="size-4" />
    </motion.button>
  );

  return (
    <HoverCard openDelay={100} closeDelay={50}>
      <HoverCardTrigger asChild>
        {button}
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="center"
        sideOffset={6}
        className={cn(
          "z-[100]",
          "w-44 p-2 rounded-lg",
          "border border-neutral-200 dark:border-neutral-700",
          "bg-white dark:bg-neutral-800 shadow-md",
          "transition-opacity duration-300"
        )}
      >
        <div className="space-y-0.5">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {group.name}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
            {group.description}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const GroupSelector = ({ selectedGroup, onGroupSelect, status, onExpandChange }: GroupSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProcessing = status === 'submitted' || status === 'streaming';
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isMobile ? isExpanded : false);
    }
  }, [isExpanded, onExpandChange, isMobile]);

  return (
    <motion.div
      layout={false}
      initial={false}
      animate={{
        width: isExpanded && !isProcessing ? "auto" : "30px",
        gap: isExpanded && !isProcessing ? "0.5rem" : 0,
        paddingRight: isExpanded && !isProcessing ? "0.25rem" : 0,
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      className={cn(
        "inline-flex items-center min-w-[38px] p-0.5",
        "rounded-full border border-neutral-200 dark:border-neutral-800",
        "bg-white dark:bg-neutral-900 shadow-sm overflow-visible",
        "relative z-10",
        isProcessing && "opacity-50 pointer-events-none"
      )}
      onMouseEnter={() => !isProcessing && setIsExpanded(true)}
      onMouseLeave={() => !isProcessing && setIsExpanded(false)}
    >
      <AnimatePresence initial={false}>
        {searchGroups.filter(group => group.show).map((group, index, filteredGroups) => {
          const showItem = (isExpanded && !isProcessing) || selectedGroup === group.id;
          const isLastItem = index === filteredGroups.length - 1;
          return (
            <motion.div
              key={group.id}
              layout={false}
              animate={{
                width: showItem ? "28px" : 0,
                opacity: showItem ? 1 : 0,
                marginRight: (showItem && isLastItem && isExpanded) ? "2px" : 0
              }}
              transition={{
                duration: 0.15,
                ease: "easeInOut"
              }}
              className={cn(
                isLastItem && isExpanded && showItem ? "pr-0.5" : ""
              )}
              style={{ margin: 0 }}
            >
              <ToolbarButton
                group={group}
                isSelected={selectedGroup === group.id}
                onClick={() => !isProcessing && onGroupSelect(group)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

// Main MultimodalInput Component
const MAX_IMAGES = 4;
const MAX_INPUT_CHARS = 1000;

const hasVisionSupport = (modelValue: string): boolean => {
  const selectedModel = models.find(model => model.value === modelValue);
  return selectedModel?.vision === true;
};

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postSubmitFileInputRef = useRef<HTMLInputElement>(null);
  const { width } = useWindowSize();
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGroupSelectorExpanded, setIsGroupSelectorExpanded] = useState(false);
  const [isExceedingLimit, setIsExceedingLimit] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<UploadingAttachment>>([]);
  const [selectedGroup, setSelectedGroup] = useState<SearchGroupId>('grok');
  const [selectedModel, setSelectedModel] = useState<string>('scira-default');

  const MIN_HEIGHT = 72;
  const MAX_HEIGHT = 400;

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${MIN_HEIGHT}px`;
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage('input', '');

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const newValue = event.target.value;

    if (newValue.length > MAX_INPUT_CHARS) {
      setIsExceedingLimit(true);
      setInput(newValue);
      toast.error(`Your input exceeds the maximum of ${MAX_INPUT_CHARS} characters.`);
    } else {
      setIsExceedingLimit(false);
      setInput(newValue);
    }

    adjustHeight();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleGroupSelect = useCallback((group: SearchGroup) => {
    setSelectedGroup(group.id);
    textareaRef.current?.focus();
  }, []);

  const uploadFile = async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;
        return { url, name: pathname || file.name, contentType, size: file.size };
      }
      const { error } = await response.json();
      toast.error(error);
      throw new Error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
      throw error;
    }
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalAttachments = attachments.length + files.length;

    if (totalAttachments > MAX_IMAGES) {
      toast.error(`You can only attach up to ${MAX_IMAGES} images.`);
      return;
    }

    setUploadQueue(files.map((file) => ({ file, progress: 0, name: file.name })));

    try {
      const uploadPromises = files.map((file) => uploadFile(file));
      const uploadedAttachments = await Promise.all(uploadPromises);
      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...uploadedAttachments,
      ]);

      const currentModel = models.find(m => m.value === selectedModel);
      if (!currentModel?.vision) {
        const visionModel = models.find(model => model.vision)?.value || selectedModel;
        setSelectedModel(visionModel);
        toast.success(`Switched to ${models.find(m => m.value === visionModel)?.label} for image support`);
      }
    } catch (error) {
      console.error("Error uploading files!", error);
    } finally {
      setUploadQueue([]);
      event.target.value = '';
    }
  }, [attachments, setAttachments, selectedModel, setSelectedModel]);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (attachments.length >= MAX_IMAGES) return;

    if (e.dataTransfer.items && e.dataTransfer.items[0].kind === "file") {
      setIsDragging(true);
    }
  }, [attachments.length]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) {
      toast.error("Only image files are supported");
      return;
    }

    const totalAttachments = attachments.length + files.length;
    if (totalAttachments > MAX_IMAGES) {
      toast.error(`You can only attach up to ${MAX_IMAGES} images.`);
      return;
    }

    const currentModel = models.find(m => m.value === selectedModel);
    if (!currentModel?.vision) {
      const visionModel = models.find(model => model.vision)?.value || selectedModel;
      setSelectedModel(visionModel);
      toast.success(`Switched to ${models.find(m => m.value === visionModel)?.label} for image support`);
    }

    setUploadQueue(files.map((file) => ({ file, progress: 0, name: file.name })));

    try {
      const uploadPromises = files.map((file) => uploadFile(file));
      const uploadedAttachments = await Promise.all(uploadPromises);
      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...uploadedAttachments,
      ]);
    } catch (error) {
      console.error("Error uploading files!", error);
      toast.error("Failed to upload one or more files. Please try again.");
    } finally {
      setUploadQueue([]);
    }
  }, [attachments.length, setAttachments, selectedModel, setSelectedModel]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault();

    const totalAttachments = attachments.length + imageItems.length;
    if (totalAttachments > MAX_IMAGES) {
      toast.error(`You can only attach up to ${MAX_IMAGES} images.`);
      return;
    }

    const currentModel = models.find(m => m.value === selectedModel);
    if (!currentModel?.vision) {
      const visionModel = models.find(model => model.vision)?.value || selectedModel;
      setSelectedModel(visionModel);
      toast.success(`Switched to ${models.find(m => m.value === visionModel)?.label} for image support`);
    }

    setUploadQueue(imageItems.map((_, i) => ({ file: new File([], `Pasted Image ${i + 1}`), progress: 0, name: `Pasted Image ${i + 1}` })));

    try {
      const files = imageItems.map(item => item.getAsFile()).filter(Boolean) as File[];
      const uploadPromises = files.map(file => uploadFile(file));
      const uploadedAttachments = await Promise.all(uploadPromises);

      setAttachments(currentAttachments => [
        ...currentAttachments,
        ...uploadedAttachments,
      ]);

      toast.success('Image pasted successfully');
    } catch (error) {
      console.error("Error uploading pasted files!", error);
      toast.error("Failed to upload pasted image. Please try again.");
    } finally {
      setUploadQueue([]);
    }
  }, [attachments.length, setAttachments, selectedModel, setSelectedModel]);

  const submitForm = useCallback(() => {
    if (status !== 'ready') {
      toast.error("Please wait for the current response to complete!");
      return;
    }

    if (input.length > MAX_INPUT_CHARS) {
      toast.error(`Your input exceeds the maximum of ${MAX_INPUT_CHARS} characters. Please shorten your message.`);
      return;
    }

    if (input.trim() || attachments.length > 0) {
      handleSubmit(undefined, {
        experimental_attachments: attachments,
      });

      setAttachments([]);
      setInput('');
      setLocalStorageInput('');
      resetHeight();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (width && width > 768) {
        textareaRef.current?.focus();
      }
    } else {
      toast.error("Please enter a message or attach an image.");
    }
  }, [input, attachments, handleSubmit, setAttachments, setInput, setLocalStorageInput, status, width]);

  const triggerFileInput = useCallback(() => {
    if (attachments.length >= MAX_IMAGES) {
      toast.error(`You can only attach up to ${MAX_IMAGES} images.`);
      return;
    }

    if (status === 'ready') {
      postSubmitFileInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  }, [attachments.length, status, fileInputRef]);

  const isProcessing = status === 'submitted' || status === 'streaming';
  const hasInteracted = messages.length > 0;
  const isMobile = width ? width < 768 : false;

  return (
    <div
      className={cn(
        "relative w-full flex flex-col gap-2 rounded-lg transition-all duration-300 !font-sans",
        hasInteracted ? "z-[51]" : "",
        isDragging && "ring-1 ring-neutral-300 dark:ring-neutral-700",
        attachments.length > 0 || uploadQueue.length > 0
          ? "bg-gray-100/70 dark:bg-neutral-800 p-1"
          : "bg-transparent"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-[2px] bg-background/80 dark:bg-neutral-900/80 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center z-50 m-2"
          >
            <div className="flex items-center gap-4 px-6 py-8">
              <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-sm">
                <Upload className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Drop images here
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  Max {MAX_IMAGES} images
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" className="hidden" ref={fileInputRef} multiple onChange={handleFileChange} accept="image/*" tabIndex={-1} />
      <input type="file" className="hidden" ref={postSubmitFileInputRef} multiple onChange={handleFileChange} accept="image/*" tabIndex={-1} />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-auto py-2 max-h-32 z-10 px-1">
          {attachments.map((attachment, index) => (
            <AttachmentPreview
              key={attachment.url}
              attachment={attachment}
              onRemove={() => removeAttachment(index)}
              isUploading={false}
            />
          ))}
          {uploadQueue.map((uploadingAttachment) => (
            <AttachmentPreview
              key={uploadingAttachment.name}
              attachment={uploadingAttachment}
              onRemove={() => { }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative rounded-lg bg-neutral-100 dark:bg-neutral-900">
        <Textarea
          ref={textareaRef}
          placeholder={hasInteracted ? "Ask a new question..." : "Ask a question..."}
          value={input}
          onChange={handleInput}
          disabled={isProcessing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "min-h-[72px] w-full resize-none rounded-lg",
            "text-base leading-relaxed",
            "bg-neutral-100 dark:bg-neutral-900",
            "border !border-neutral-200 dark:!border-neutral-700",
            "focus:!border-neutral-300 dark:focus:!border-neutral-600",
            isFocused ? "!border-neutral-300 dark:!border-neutral-600" : "",
            "text-neutral-900 dark:text-neutral-100",
            "focus:!ring-1 focus:!ring-neutral-300 dark:focus:!ring-neutral-600",
            "px-4 py-4 pb-16",
            "overflow-y-auto",
            "touch-manipulation",
          )}
          style={{
            maxHeight: `${MAX_HEIGHT}px`,
            WebkitUserSelect: 'text',
            WebkitTouchCallout: 'none',
          }}
          rows={1}
          autoFocus={width ? width > 768 : true}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (status === 'submitted' || status === 'streaming') {
                toast.error("Please wait for the response to complete!");
              } else {
                submitForm();
                if (width && width > 768) {
                  setTimeout(() => {
                    textareaRef.current?.focus();
                  }, 100);
                }
              }
            }
          }}
          onPaste={handlePaste}
        />

        {input.length > 0 && (
          <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 z-10">
            <CharacterCounter current={input.length} max={MAX_INPUT_CHARS} />
          </div>
        )}

        <div className={cn(
          "absolute bottom-0 inset-x-0 flex justify-between items-center p-2 rounded-b-lg",
          "bg-neutral-100 dark:bg-neutral-900",
          "!border !border-t-0 !border-neutral-200 dark:!border-neutral-700",
          isFocused ? "!border-neutral-300 dark:!border-neutral-600" : "",
          isProcessing ? "!opacity-20 !cursor-not-allowed" : ""
        )}>
          <div className={cn(
            "flex items-center gap-2",
            isMobile && "overflow-hidden"
          )}>
            <div className={cn(
              "transition-all duration-100",
              (selectedGroup !== 'extreme')
                ? "opacity-100 visible w-auto"
                : "opacity-0 invisible w-0"
            )}>
              <GroupSelector
                selectedGroup={selectedGroup}
                onGroupSelect={handleGroupSelect}
                status={status}
                onExpandChange={setIsGroupSelectorExpanded}
              />
            </div>

            <div className={cn(
              "transition-all duration-300",
              (isMobile && isGroupSelectorExpanded) ? "opacity-0 w-0 invisible" : "opacity-100 visible w-auto"
            )}>
              <ModelSwitcher
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                showExperimentalModels={false}
                attachments={attachments}
                messages={messages}
                status={status}
              />
            </div>

            <div className={cn(
              "transition-all duration-300",
              (isMobile && isGroupSelectorExpanded)
                ? "opacity-0 invisible w-0"
                : "opacity-100 visible w-auto"
            )}>
              <button
                onClick={() => {
                  setSelectedGroup(selectedGroup === 'extreme' ? 'web' : 'extreme');
                  if (isMobile) {
                    const newMode = selectedGroup === 'extreme' ? 'Web Search' : 'Extreme Mode';
                    const description = selectedGroup === 'extreme'
                      ? 'Standard web search mode'
                      : 'Enhanced deep research mode';
                    toast(`Switched to ${newMode}: ${description}`, {
                      duration: 2000,
                    });
                  }
                }}
                className={cn(
                  "flex items-center gap-2 p-2 sm:px-3 h-8",
                  "rounded-full transition-all duration-300",
                  "border border-neutral-200 dark:border-neutral-800",
                  "hover:shadow-md",
                  selectedGroup === 'extreme'
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-white dark:bg-neutral-900 text-neutral-500",
                )}
              >
                <Mountain className="h-3.5 w-3.5" />
                <span className="hidden sm:block text-xs font-medium">Extreme</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasVisionSupport(selectedModel) && !(isMobile && isGroupSelectorExpanded) && (
              <Button
                className="rounded-full p-1.5 h-8 w-8 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                onClick={(event) => {
                  event.preventDefault();
                  triggerFileInput();
                }}
                variant="outline"
                disabled={isProcessing}
              >
                <X size={14} />
              </Button>
            )}

            {isProcessing ? (
              <Button
                className="rounded-full p-1.5 h-8 w-8"
                onClick={(event) => {
                  event.preventDefault();
                  stop();
                  setMessages((messages) => sanitizeUIMessages(messages));
                }}
                variant="destructive"
              >
                <Square size={14} />
              </Button>
            ) : (
              <Button
                className="rounded-full p-1.5 h-8 w-8"
                onClick={(event) => {
                  event.preventDefault();
                  submitForm();
                }}
                disabled={input.length === 0 && attachments.length === 0 || uploadQueue.length > 0 || status !== 'ready'}
              >
                <ArrowUp size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    return true;
  },
);