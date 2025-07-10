import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SplashScreen } from '../SplashScreen';

// Mock the AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

// Mock the OnboardingIllustration component
jest.mock('../../components/OnboardingIllustration', () => ({
  OnboardingIllustration: ({ type }) => <mock-illustration type={type} />,
}));

describe('SplashScreen', () => {
  const mockNavigation = {};
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial page', () => {
    const { getByText } = render(
      <SplashScreen navigation={mockNavigation} onComplete={mockOnComplete} />
    );

    // Check if the first page content is displayed
    expect(getByText('Welcome to Findaroo')).toBeTruthy();
    expect(getByText('The community-powered lost & found network that helps you find your lost items.')).toBeTruthy();
  });

  it('navigates to the next page when Next button is pressed', () => {
    const { getByText } = render(
      <SplashScreen navigation={mockNavigation} onComplete={mockOnComplete} />
    );

    // Press the Next button
    fireEvent.press(getByText('Next'));

    // Check if the second page content is displayed
    expect(getByText('Report Lost or Found Items')).toBeTruthy();
  });

  it('calls onComplete when Get Started button is pressed on the last page', () => {
    const { getByText } = render(
      <SplashScreen navigation={mockNavigation} onComplete={mockOnComplete} />
    );

    // Navigate to the last page
    fireEvent.press(getByText('Next')); // to page 2
    fireEvent.press(getByText('Next')); // to page 3

    // Check if we're on the last page
    expect(getByText('Connect and Recover')).toBeTruthy();

    // Press the Get Started button
    fireEvent.press(getByText('Get Started'));

    // Check if onComplete was called
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Skip button is pressed', () => {
    const { getByText } = render(
      <SplashScreen navigation={mockNavigation} onComplete={mockOnComplete} />
    );

    // Press the Skip button
    fireEvent.press(getByText('Skip'));

    // Check if onComplete was called
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });
});