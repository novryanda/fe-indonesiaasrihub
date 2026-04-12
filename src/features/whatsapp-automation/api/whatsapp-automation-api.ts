import { apiClient } from "@/shared/api/api-client";

import type { WhatsappAutomationItem } from "../types/whatsapp-automation.type";

function mapItem(item: {
  id: string;
  key: WhatsappAutomationItem["key"];
  name: string;
  description: string;
  execution_mode: WhatsappAutomationItem["executionMode"];
  supported_execution_modes: WhatsappAutomationItem["supportedExecutionModes"];
  supported_variables: string[];
  target_roles: WhatsappAutomationItem["targetRoles"];
  template_body: string;
  run_at: string | null;
  is_active: boolean;
  updated_at: string;
}): WhatsappAutomationItem {
  return {
    id: item.id,
    key: item.key,
    name: item.name,
    description: item.description,
    executionMode: item.execution_mode,
    supportedExecutionModes: item.supported_execution_modes,
    supportedVariables: item.supported_variables,
    targetRoles: item.target_roles,
    templateBody: item.template_body,
    runAt: item.run_at,
    isActive: item.is_active,
    updatedAt: item.updated_at,
  };
}

export async function listWhatsappAutomations() {
  const response = await apiClient<
    Array<{
      id: string;
      key: WhatsappAutomationItem["key"];
      name: string;
      description: string;
      execution_mode: WhatsappAutomationItem["executionMode"];
      supported_execution_modes: WhatsappAutomationItem["supportedExecutionModes"];
      supported_variables: string[];
      target_roles: WhatsappAutomationItem["targetRoles"];
      template_body: string;
      run_at: string | null;
      is_active: boolean;
      updated_at: string;
    }>
  >("/v1/whatsapp-automation");

  return {
    ...response,
    data: response.data.map(mapItem),
  };
}

export async function updateWhatsappAutomation(
  key: WhatsappAutomationItem["key"],
  payload: {
    executionMode: WhatsappAutomationItem["executionMode"];
    targetRoles: WhatsappAutomationItem["targetRoles"];
    templateBody: string;
    runAt: string | null;
    isActive: boolean;
  },
) {
  const response = await apiClient<{
    id: string;
    key: WhatsappAutomationItem["key"];
    name: string;
    description: string;
    execution_mode: WhatsappAutomationItem["executionMode"];
    supported_execution_modes: WhatsappAutomationItem["supportedExecutionModes"];
    supported_variables: string[];
    target_roles: WhatsappAutomationItem["targetRoles"];
    template_body: string;
    run_at: string | null;
    is_active: boolean;
    updated_at: string;
  }>(`/v1/whatsapp-automation/${key}`, {
    method: "PATCH",
    body: {
      execution_mode: payload.executionMode,
      target_roles: payload.targetRoles,
      template_body: payload.templateBody,
      run_at: payload.runAt,
      is_active: payload.isActive,
    },
  });

  return {
    ...response,
    data: mapItem(response.data),
  };
}
