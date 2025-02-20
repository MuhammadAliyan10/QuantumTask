import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { AlertCircle, Edit, Trash, Power, PowerOff } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Placeholder for logging (integrate with your production logging system)
const log = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
};

const ErrorHandlerNode = ({ id, data }: NodeProps) => {
  const [description, setDescription] = useState(data.description || "");
  const [errorAction, setErrorAction] = useState(
    data.config?.errorAction || "log"
  ); // Action on error: log, retry, redirect
  const [maxRetries, setMaxRetries] = useState(data.config?.maxRetries || 3); // Max retry attempts
  const [retryDelay, setRetryDelay] = useState(data.config?.retryDelay || 1000); // Delay between retries in ms
  const [timeout, setTimeout] = useState(data.config?.timeout || 5000); // Timeout for error handling in ms
  const [isEnabled, setIsEnabled] = useState(data.config?.isEnabled !== false); // Default to enabled
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle"); // Execution status
  const { setNodes } = useReactFlow();

  // Sync status with data from AutomationExecutor (log output/error instead of displaying)
  useEffect(() => {
    if (data.error) {
      setStatus("error");
      log.error(`ErrorHandlerNode ${id}: ${data.error}`);
      setErrorMessage(data.error);
    } else if (data.output) {
      setStatus("running");
      log.info(
        `ErrorHandlerNode ${id}: Handled error - ${JSON.stringify(data.output)}`
      );
    } else {
      setStatus("idle");
      setErrorMessage(null);
    }
  }, [data.error, data.output, id]);

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    log.info(`ErrorHandlerNode ${id}: Deleted`);
  };

  const handleToggleEnable = () => {
    const newEnabledState = !isEnabled;
    setIsEnabled(newEnabledState);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, isEnabled: newEnabledState },
              },
            }
          : node
      )
    );
    log.info(
      `ErrorHandlerNode ${id}: ${newEnabledState ? "Enabled" : "Disabled"}`
    );
  };

  const validateInputs = () => {
    if (!description.trim()) {
      setErrorMessage("Description is required");
      return false;
    }
    const maxRetriesNum = Number(maxRetries);
    if (isNaN(maxRetriesNum) || maxRetriesNum < 0) {
      setErrorMessage("Max retries must be a non-negative number");
      return false;
    }
    const retryDelayNum = Number(retryDelay);
    if (isNaN(retryDelayNum) || retryDelayNum < 0) {
      setErrorMessage("Retry delay must be a non-negative number");
      return false;
    }
    const timeoutNum = Number(timeout);
    if (isNaN(timeoutNum) || timeoutNum < 0) {
      setErrorMessage("Timeout must be a non-negative number");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleSave = () => {
    if (!validateInputs()) return;

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                description,
                config: {
                  ...node.data.config,
                  errorAction,
                  maxRetries: Number(maxRetries),
                  retryDelay: Number(retryDelay),
                  timeout: Number(timeout),
                  isEnabled,
                },
              },
            }
          : node
      )
    );
    setIsDialogOpen(false);
    log.info(
      `ErrorHandlerNode ${id}: Configuration saved - ${description}, Action: ${errorAction}, Max Retries: ${maxRetries}`
    );
  };

  return (
    <div
      className={`relative min-w-[12rem] text-white p-3 rounded-xl shadow-md border border-gray-600 group bg-gray-900 transition-all hover:shadow-lg ${
        !isEnabled ? "opacity-50" : ""
      }`}
    >
      {/* Action buttons, visible on hover */}
      <div className="absolute -top-[44px] left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-md p-2 flex justify-between items-center gap-x-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Edit
                    size={18}
                    className="cursor-pointer text-gray-400 hover:text-blue-400 transition-colors"
                    onClick={() => setIsDialogOpen(true)}
                  />
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white rounded-lg shadow-xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                      Configure Error Handler
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description" className="text-gray-300">
                        Description
                      </Label>
                      <Input
                        id="description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Handle page load errors"
                        className="bg-gray-700 border-none text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="errorAction" className="text-gray-300">
                        Error Action
                      </Label>
                      <Select
                        value={errorAction}
                        onValueChange={setErrorAction}
                      >
                        <SelectTrigger
                          id="errorAction"
                          className="bg-gray-700 border-none text-white"
                        >
                          <SelectValue placeholder="Select error action" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 text-white">
                          <SelectItem value="log">Log Error</SelectItem>
                          <SelectItem value="retry">Retry Operation</SelectItem>
                          <SelectItem value="redirect">
                            Redirect Flow
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errorAction === "retry" && (
                      <>
                        <div>
                          <Label htmlFor="maxRetries" className="text-gray-300">
                            Max Retries
                          </Label>
                          <Input
                            id="maxRetries"
                            type="number"
                            value={maxRetries}
                            onChange={(e) => setMaxRetries(e.target.value)}
                            placeholder="e.g., 3"
                            min="0"
                            className="bg-gray-700 border-none text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="retryDelay" className="text-gray-300">
                            Retry Delay (ms)
                          </Label>
                          <Input
                            id="retryDelay"
                            type="number"
                            value={retryDelay}
                            onChange={(e) => setRetryDelay(e.target.value)}
                            placeholder="e.g., 1000"
                            min="0"
                            className="bg-gray-700 border-none text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="timeout" className="text-gray-300">
                        Timeout (ms)
                      </Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={timeout}
                        onChange={(e) => setTimeout(e.target.value)}
                        placeholder="e.g., 5000"
                        min="0"
                        className="bg-gray-700 border-none text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {errorMessage && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={16} />
                        <span className="text-sm">{errorMessage}</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="text-white border-gray-600 hover:bg-gray-700"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md"
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-700 text-white">
              <p>Edit Error Handler</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="border border-r-white h-[15px]"></span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Trash
                size={18}
                className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                onClick={handleDelete}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-gray-700 text-white">
              <p>Delete Error Handler</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Node Display */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          {(isEnabled && (
            <span className="p-3 bg-[#000000] text-white rounded-lg shadow-md">
              <AlertCircle size={20} />
            </span>
          )) || (
            <span className="p-3 bg-[#000000] text-white rounded-lg shadow-md opacity-50">
              <AlertCircle size={20} />
            </span>
          )}
          <span className="text-sm font-semibold">Error Handler</span>
          {/* Status Indicator */}
          <span
            className={`ml-2 w-2 h-2 rounded-full ${
              status === "running"
                ? "bg-green-500 animate-pulse"
                : status === "error"
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
          />
          {/* Enable/Disable Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 p-1 text-gray-400 hover:text-white"
                  onClick={handleToggleEnable}
                >
                  {isEnabled ? (
                    <Power size={16} className="text-green-500" />
                  ) : (
                    <PowerOff size={16} className="text-red-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-700 text-white">
                <p>{isEnabled ? "Disable Handler" : "Enable Handler"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {description && (
          <p className="text-xs text-gray-400 italic max-w-[10rem] truncate">
            {description}
          </p>
        )}
        <p className="text-xs text-gray-300 capitalize">
          Action: {errorAction}
          {errorAction === "retry" ? `, Retries: ${maxRetries}` : ""}
        </p>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: "0.6rem", height: "0.6rem", background: "#FF6B6B" }} // Matches icon color
      />
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        style={{
          top: "30%",
          width: "0.6rem",
          height: "0.6rem",
          background: "#000000",
        }} // Success path
      />
      <Handle
        type="source"
        position={Position.Right}
        id="failure"
        style={{
          top: "70%",
          width: "0.6rem",
          height: "0.6rem",
          background: "#000000",
        }} // Failure path
      />
    </div>
  );
};

export { ErrorHandlerNode };
