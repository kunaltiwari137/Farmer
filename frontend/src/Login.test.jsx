import "@testing-library/jest-dom/vitest";

import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

import { describe, test, expect, afterEach, vi } from "vitest";

import { MemoryRouter, useLocation } from "react-router-dom";

import Login from "./Login";


// Google Login ko mock kar rahe hain
vi.mock("@react-oauth/google", () => ({
  GoogleLogin: () => <button>Google Login</button>,
}));


// Axios ko mock kar rahe hain
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from "axios";


afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});


// Current URL check karne ke liye
function LocationDisplay() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}


describe("Login Page", () => {


  // Test 1
  test("should display login form", () => {

    render(
      <MemoryRouter>
        <Login onLoginSuccess={() => {}} />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: "Login",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Log In",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Google Login",
      })
    ).toBeInTheDocument();

  });


  // Test 2
  test("should show error for invalid login", async () => {

    axios.post.mockRejectedValue({
      response: {
        data: {
          error: "Invalid email or password",
        },
      },
    });


    render(
      <MemoryRouter>
        <Login onLoginSuccess={() => {}} />
      </MemoryRouter>
    );


    const emailInput = document.querySelector(
      'input[type="email"]'
    );

    const passwordInput = document.querySelector(
      'input[type="password"]'
    );


    fireEvent.change(emailInput, {
      target: {
        value: "wrong@example.com",
      },
    });


    fireEvent.change(passwordInput, {
      target: {
        value: "wrongpassword",
      },
    });


    fireEvent.click(
      screen.getByRole("button", {
        name: "Log In",
      })
    );


    await waitFor(() => {
      expect(
        screen.getByText("Invalid email or password")
      ).toBeInTheDocument();
    });

  });


  // Test 3
  test("should login successfully and save user data", async () => {

    const user = {
      id: "123",
      name: "Test User",
      email: "test@example.com",
      role: "farmer",
    };


    axios.post.mockResolvedValue({
      data: {
        otp_required: true,
        user_id: "123",
      },
    });


    render(
      <MemoryRouter>
        <Login onLoginSuccess={() => {}} />
      </MemoryRouter>
    );


    const emailInput = document.querySelector(
      'input[type="email"]'
    );

    const passwordInput = document.querySelector(
      'input[type="password"]'
    );


    fireEvent.change(emailInput, {
      target: {
        value: "test@example.com",
      },
    });


    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });


    fireEvent.click(
      screen.getByRole("button", {
        name: "Log In",
      })
    );


    // OTP screen should appear
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Enter OTP",
        })
      ).toBeInTheDocument();
    });


    // Mock OTP verification response
    axios.post.mockResolvedValueOnce({
      data: {
        token: "test-token",
        user: user,
      },
    });


    const otpInput = document.querySelector(
      'input[placeholder="000000"]'
    );


    fireEvent.change(otpInput, {
      target: {
        value: "123456",
      },
    });


    fireEvent.click(
      screen.getByRole("button", {
        name: "Verify & Login",
      })
    );


    await waitFor(() => {

      expect(
        localStorage.getItem("token")
      ).toBe("test-token");


      expect(
        JSON.parse(localStorage.getItem("user"))
      ).toEqual(user);

    });

  });


});