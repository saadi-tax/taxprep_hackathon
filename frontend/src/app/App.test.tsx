import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";

const renderApp = () => {
  const queryClient = new QueryClient();
  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("App routing", () => {
  it("renders dashboard heading", () => {
    renderApp();
    expect(screen.getByText(/Tax Cases/i)).toBeInTheDocument();
  });
});

