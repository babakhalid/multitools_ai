'use client';

import type { ChatRequestOptions, Message } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useEffect } from 'react'; // Add useEffect import
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import { generateUUID } from '@/lib/utils';

// Import booking components
import { SignInForm } from './booking/SignInForm';
import { ServiceSelector } from './booking/ServiceSelector';
import { CalendarSelector } from './booking/CalendarSelector';
import { TimeSlotSelector } from './booking/TimeSlotSelector';
import { BookingConfirmation } from './booking/BookingConfirmation';

// Define types for the booking workflow
interface AuthData {
  success: boolean;
  userId: string;
  token: string;
}

interface Service {
  id: string;
  name: string;
  availableDays: string[];
}

interface Holiday {
  date: string;
  description: string;
  isOff: boolean;
}

interface TimeSlot {
  id: string;
  timeStart: string;
  timeEnd: string;
  canBook: boolean;
  capacity: number;
  reserved: number;
}

interface Credentials {
  email: string;
  password: string;
}

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  // Booking workflow state with proper types
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  // Use useEffect to handle authData updates and trigger fetchServices
  useEffect(() => {
    if (authData) {
      handleFetchServices();
    }
  }, [authData]); // Run when authData changes

  // Booking handlers with typed parameters
  const handleSignIn = (credentials: Credentials) => {
    reload({ data: JSON.stringify({ tool: 'signIn', ...credentials }) });
  };

  const handleFetchServices = () => {
    if (authData) {
      reload({ data: JSON.stringify({ tool: 'getServices', token: authData.token }) });
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setMessages((prev: Message[]) => [
      ...prev,
      { id: generateUUID(), role: 'user', content: `Selected service: ${service.name}` } as Message,
    ]);
    if (authData) {
      reload({ data: JSON.stringify({ tool: 'getHolidays', token: authData.token }) });
    }
  };

  const handleFetchHolidays = () => {
    if (authData) {
      reload({ data: JSON.stringify({ tool: 'getHolidays', token: authData.token }) });
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setMessages((prev: Message[]) => [
      ...prev,
      { id: generateUUID(), role: 'user', content: `Selected date: ${date}` } as Message,
    ]);
    if (authData && selectedService) {
      reload({
        data: JSON.stringify({
          tool: 'getTimeSlots',
          token: authData.token,
          serviceId: selectedService.id,
          date,
        }),
      });
    }
  };

  const handleFetchTimeSlots = (serviceId: string, date: string) => {
    if (authData) {
      reload({
        data: JSON.stringify({
          tool: 'getTimeSlots',
          token: authData.token,
          serviceId,
          date,
        }),
      });
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    if (authData && selectedService && selectedDate) {
      reload({
        data: JSON.stringify({
          tool: 'bookService',
          userId: authData.userId,
          token: authData.token,
          serviceId: selectedService.id,
          date: selectedDate,
          timeSlotId: slot.id,
        }),
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.reasoning && (
              <MessageReasoning
                isLoading={isLoading}
                reasoning={message.reasoning}
              />
            )}

            {(message.content || message.reasoning) && mode === 'view' && (
              <div
                data-testid="message-content"
                className="flex flex-row gap-2 items-start"
              >
                {message.role === 'user' && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid={`message-edit`}
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div
                  className={cn('flex flex-col gap-4', {
                    'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                      message.role === 'user',
                  })}
                >
                  <Markdown>{message.content as string}</Markdown>
                </div>
              </div>
            )}

            {message.content && mode === 'edit' && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />

                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                />
              </div>
            )}

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-4">
                {message.toolInvocations.map((toolInvocation) => {
                  const { toolName, toolCallId, state, args } = toolInvocation;

                  if (state === 'result') {
                    const { result } = toolInvocation;

                    return (
                      <div key={toolCallId}>
                        {toolName === 'getWeather' ? (
                          <Weather weatherAtLocation={result} />
                        ) : toolName === 'createDocument' ? (
                          <DocumentPreview
                            isReadonly={isReadonly}
                            result={result}
                          />
                        ) : toolName === 'updateDocument' ? (
                          <DocumentToolResult
                            type="update"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : toolName === 'requestSuggestions' ? (
                          <DocumentToolResult
                            type="request-suggestions"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : toolName === 'signIn' ? (
                          (setAuthData(result), null) // Removed handleFetchServices from render
                        ) : toolName === 'getServices' ? (
                          (setServices(result.services),
                          <ServiceSelector services={result.services} onSelect={handleServiceSelect} />)
                        ) : toolName === 'getHolidays' ? (
                          (setHolidays(result.holidays),
                          selectedService && holidays ? (
                            <CalendarSelector
                              service={selectedService}
                              holidays={result.holidays}
                              onSelect={handleDateSelect}
                              onFetchHolidays={handleFetchHolidays}
                            />
                          ) : null)
                        ) : toolName === 'getTimeSlots' ? (
                          (setTimeslots(result.timeslots),
                          selectedService && selectedDate && authData ? (
                            <TimeSlotSelector
                              serviceId={selectedService.id}
                              date={selectedDate}
                              token={authData.token}
                              onSelect={handleTimeSlotSelect}
                              onFetchTimeSlots={handleFetchTimeSlots}
                            />
                          ) : null)
                        ) : toolName === 'bookService' ? (
                          selectedService && selectedDate && selectedTimeSlot ? (
                            <BookingConfirmation
                              bookingDetails={{
                                service: selectedService.name,
                                date: selectedDate,
                                timeStart: selectedTimeSlot.timeStart,
                                timeEnd: selectedTimeSlot.timeEnd,
                                bookingId: result.bookingId,
                              }}
                            />
                          ) : null
                        ) : (
                          <pre>{JSON.stringify(result, null, 2)}</pre>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'signIn' && !authData ? (
                        <SignInForm onSubmit={handleSignIn} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning)
      return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};